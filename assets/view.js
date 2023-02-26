CTFd._internal.challenge.data = undefined

CTFd._internal.challenge.renderer = null;


CTFd._internal.challenge.preRender = function () { }

CTFd._internal.challenge.render = null;


CTFd._internal.challenge.postRender = function () { }


CTFd._internal.challenge.submit = function(preview) {
    var challenge_id = parseInt(CTFd.lib.$("#challenge-id").val());
    var submission = CTFd.lib.$("#challenge-input").val();
  
    var body = {
      challenge_id: challenge_id,
      submission: submission
    };
    var params = {};
    if (preview) {
      params["preview"] = true;
    }
  
    return CTFd.api.post_challenge_attempt(params, body).then(function(response) {
      if (response.status === 429) {
        // User was ratelimited but process response
        return response;
      }
      if (response.status === 403) {
        // User is not logged in or CTF is paused.
        return response;
      }
      return response;
    });
  };
  

function deployment() {
    return {
        deploymentName: null,
        danger: false,
        alert: null,
        challengeCreateVisible: false,
        challengeUpdateVisible: false,
        createLoading: false,
        extendLoading: false,
        terminateLoading: false,
        expires: null,
        host: null,
        setDanger() { this.danger = true },
        unsetDanger() { this.danger = false },
        isDanger() { return this.danger === true },
        setAlertText(text) { this.alert = text},
        resetAlert() {
            this.setAlertText(null);
            this.unsetDanger();
        },
        toggleChallengeCreate() {
            this.challengeCreateVisible = !this.challengeCreateVisible;
        },
        toggleChallengeUpdate() {
            this.challengeUpdateVisible = !this.challengeUpdateVisible;
        },
        toggleCreateLoading() {
            this.createLoading = !this.createLoading;
        },
        toggleExtendLoading() {
            this.extendLoading = !this.extendLoading;
        },
        toggleTerminateLoading() {
            this.terminateLoading = !this.terminateLoading;
        },
        getDeployment(deploymentName) {
            this.deploymentName = deploymentName;
            this.resetAlert();
            fetch("api/kube_ctf/" + deploymentName).then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        this.createChallengeLinkElement(data);
                        this.toggleChallengeUpdate();
                    });
                } else {
                    this.setAlertText("Challenge not started");
                    this.toggleChallengeCreate();
                }
            }).catch(error => {
                console.log(error);
            });
        },
        createDeployment() {
            this.toggleCreateLoading();
            this.resetAlert();
            fetch("api/kube_ctf/" + this.deploymentName, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({action: "create"})
            }).then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        this.createChallengeLinkElement(data);
                        this.toggleChallengeUpdate();
                        this.toggleChallengeCreate();
                        this.toggleCreateLoading();
                    });
                } else {
                    response.json().then(error => {
                        this.setAlertText(error.error || error.message);
                        this.setDanger();
                        this.toggleCreateLoading();
                    });
                }
            }).catch(error => {
                console.log(error);
            });
        },
        createChallengeLinkElement(data) {
            this.expires = new Date(data.deployment.expires);
            expiry = calculateExpiry(new Date(data.deployment.expires));
            if (expiry > 0) {
                this.host = data.deployment.host;
            } 
        },
        extendDeployment() {
            this.toggleExtendLoading();
            this.resetAlert();
            fetch("api/kube_ctf/" + this.deploymentName, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({action: "extend"})
            }).then(response => {
                if (response.ok) {
                    response.json().then(data => {
                        this.createChallengeLinkElement(data);
                        this.toggleExtendLoading();
                    });
                } else {
                    response.json().then(error => {
                        this.setAlertText(error.error || error.message);
                        this.setDanger();
                        this.toggleExtendLoading();
                    });
                }
            }).catch(error => {
                console.log(error);
            });
        },
        terminateDeployment() {
            this.toggleTerminateLoading();
            this.resetAlert();
            fetch("api/kube_ctf/" + this.deploymentName, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({action: "terminate"})
            }).then(response => {
                if (response.ok) {
                    this.toggleChallengeUpdate();
                    this.toggleTerminateLoading();
                    this.setAlertText("Challenge Terminated.");
                    this.expires = null;
                    this.host = null;
                    this.toggleChallengeCreate();
                } else {
                    response.json().then(error => {
                        this.setAlertText(error.error || error.message);
                        this.setDanger();
                        this.toggleTerminateLoading();
                    });
                }
            }).catch(error => {
                console.log(error);
            });
        }

    }
}


function calculateExpiry(date) {
    // Get the difference in minutes
    let difference = Math.floor((date - Date.now()) / (1000 * 60));
    return difference;
}