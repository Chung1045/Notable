$(document).ready(function () {

    $('.logout-btn').on('click', function () {
        window.location.href = '/logout';
    });

    function showAlert(message, type = 'info', duration = 5000) {
        const alertId = 'alert-' + Date.now(); // Generate a unique ID for the alert
        const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade" role="alert" style="display: none;">
            ${message}
        </div>
    `;
        const $alert = $(alertHtml);
        $("#modal-alertContainer").append($alert);

        // Fade in the alert
        $alert.fadeIn(300, function () {
            $(this).addClass('show');
        });

        // Set up auto-dismiss
        const dismissAlert = () => {
            $alert.fadeOut(300, function () {
                $(this).remove();
            });
        };

        // Automatically remove the alert after the specified duration
        const timeoutId = setTimeout(dismissAlert, duration);

    }

    function showModal(type = "default") {
        const modal = $("#ModalDialogueEdit");
        let modalContent = '';

        // Clear previous content and event listeners
        $(".modal-save-bt").off('click');

        switch (type) {
            case "userName":
                modal.find(".modal-title").text("Change Username");
                modalContent = `
                    <div class="mb-3">
                        <label for="newUserName" class="form-label">New UserName</label>
                        <input type="text" id="newUserName" class="form-control mb-2">
                        <div id="userName-error" class="invalid-feedback"></div>
                    </div>`;

                $(".modal-save-bt").on("click", () => {
                    const newUserName = $("#newUserName").val();
                    updateUserName(newUserName);
                });

                $(".modal-cancel-bt").on("click", () => {
                    $("#ModalDialogueEdit").modal('hide');
                });
                break;

            case "email":
                modal.find(".modal-title").text("Change Email");
                modalContent = `
                    <div class="mb-3">
                        <label for="newEmail" class="form-label">New email address</label>
                        <input type="email" id="newEmail" class="form-control mb-2">
                        <div id="userName-error" class="invalid-feedback"></div>
                    </div>`;

                $(".modal-save-bt").on("click", () => {
                    const newEmail = $("#newEmail").val();
                    updateEmail(newEmail);
                });

                $(".modal-cancel-bt").on("click", () => {
                    $("#ModalDialogueEdit").modal('hide');
                });
                break;

            case "password":
                modal.find(".modal-title").text("Change Password");
                modalContent = `
                    <div class="mb-3">
                        <label for="current-password" class="form-label">Current Password</label>
                        <input type="password" id="current-password" class="form-control mb-2">
                        <div id="current-password-error" class="invalid-feedback"></div>
                        <label for="new-password" class="form-label">New Password</label>
                        <input type="password" id="new-password" class="form-control mb-2">
                        <div id="new-password-error" class="invalid-feedback"></div>
                        <label for="confirm-password">Confirm New Password</label>
                        <input type="password" id="confirm-password" class="form-control">
                        <div id="confirm-password-error" class="invalid-feedback"></div>
                    </div>`;

                $(".modal-cancel-bt").on("click", () => {
                    $("#ModalDialogueEdit").modal('hide');
                });

                // Add password-specific save handler
                $(".modal-save-bt").on("click", () => {
                    const currentPassword = $("#current-password").val();
                    const newPassword = $("#new-password").val();
                    const confirmPassword = $("#confirm-password").val();

                    updatePassword(currentPassword, newPassword, confirmPassword);
                });
                break;

            default:
                modalContent = '<p>Invalid modal type</p>';
        }

        // Update modal content and show
        modal.find(".modal-body").html(modalContent);
        modal.modal('show');
    }

    function updateUserName(newUserName) {
        $("#newUserName").prop('disabled', true);
        $("#newUserName").removeClass("is-invalid");
        $("#userName-error").text("");
        try {
            $.ajax({
                url: '/api/updateUsername',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    newUserName: newUserName
                }),
                success: function () {
                    fetchUserInfo();
                    showAlert("Username updated successfully.", "success");
                    hideModalDelayed();
                },
                error: function (xhr, status, error) {
                    console.error('Error fetching user info:', error);
                    showAlert("Failed to update username", "danger");
                    $("#newUserName").prop('disabled', false);
                    $("#newUsername").addClass("is-invalid");
                    $("#userName-error").text(error);
                }
            });
        } catch (error) {
            showAlert("Failed to update username", "danger");
            $("#newUserName").prop('disabled', false);
            $("#newUsername").addClass("is-invalid");
            $("#userName-error").text(error);
        }
    }

    function updateEmail(newEmail) {
        $("#newEmail").prop('disabled', true);
        $("#newEmail").removeClass("is-invalid");
        $("#userName-error").text("");
        try {
            $.ajax({
                url: '/api/updateEmail',
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    newEmail: newEmail
                }),
                success: function () {
                    fetchUserInfo();
                    showAlert("Email updated successfully.", "success");
                    hideModalDelayed();
                },
                error: function (xhr, status, error) {
                    console.error('Failed to update email:', error);
                    showAlert("Failed to update email : " + error, "danger");
                    $("#newEmail").prop('disabled', false);
                    $("#newEmail").addClass("is-invalid");
                    $("#userName-error").text(error);
                }
            });
        } catch (error) {
            showAlert("Failed to update email : " + error, "danger");
            $("#newEmail").prop('disabled', false);
            $("#newEmail").prop('disabled', false);
            $("#newEmail").addClass("is-invalid");
            $("#userName-error").text(error);
        }
    }

    function updatePassword(currentPassword, newPassword, confirmPassword) {
        $("#current-password").prop('disabled', true);
        $("#new-password").prop('disabled', true);
        $("#confirm-password").prop('disabled', true);
        $("#current-password").removeClass("is-invalid");
        $("#new-password").removeClass("is-invalid");
        $("#confirm-password").removeClass("is-invalid");
        $("#current-password-error").text("");
        $("#new-password-error").text("");
        $("#confirm-password-error").text("");

        if (newPassword !== confirmPassword) {
            showAlert("New password does not match.", "danger");
            $("#new-password").addClass("is-invalid");
            $("#confirm-password").addClass("is-invalid");
            $("#new-password-error").text("Passwords do not match.");
            $("#confirm-password-error").text("Passwords do not match.");
            $("#current-password").prop('disabled', false);
            $("#new-password").prop('disabled', false);
            $("#confirm-password").prop('disabled', false);
        } else {
            try {
                $.ajax({
                    url: '/api/updatePassword',
                    type: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword,
                        confirmPassword: confirmPassword
                    }),
                    success: function () {
                        showAlert("Password updated successfully.", "success");
                        hideModalDelayed();
                    },
                    error: function (xhr, status, error) {
                        console.error('Failed to update password:', error);
                        let errorMessage = "Failed to update password.";
                        if (xhr.responseJSON && xhr.responseJSON.error) {
                            errorMessage = xhr.responseJSON.error;
                            showAlert(errorMessage, "danger");

                            // Handle specific error cases
                            if (errorMessage === 'Current password is incorrect') {
                                $("#current-password").addClass("is-invalid");
                                $("#current-password-error").text(errorMessage);
                            } else if (errorMessage === 'New password and confirm password do not match') {
                                $("#new-password").addClass("is-invalid");
                                $("#confirm-password").addClass("is-invalid");
                                $("#new-password-error").text(errorMessage);
                                $("#confirm-password-error").text(errorMessage);
                            }

                            $("#current-password").prop('disabled', false);
                            $("#new-password").prop('disabled', false);
                            $("#confirm-password").prop('disabled', false);
                        }
                    }
                });
            } catch (error) {
                showAlert("Failed to update password : " + error, "danger");
                $("#current-password").prop('disabled', false);
                $("#new-password").prop('disabled', false);
                $("#confirm-password").prop('disabled', false);
            }
        }
    }


    function fetchUserInfo() {
        $.ajax({
            url: '/api/fetchUserInfo',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({}),
            success: function (response) {
                console.log('Received response:', response);
                if (response.userName && response.userEmail) {
                    $("#flyout_username_value").text(response.userName);
                    $("#flyout_email_value").text(response.userEmail);
                } else {
                    console.error('Unexpected response format:', response);
                    showAlert("Failed to fetch user info.", "danger");
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching user info:', error);
                showAlert("Failed to fetch user info.", "danger");
            }
        });
    }

    function hideModalDelayed() {
        setTimeout(() => {
            $("#ModalDialogueEdit").modal('hide');
        }, 5000);
    }

    $(document).on('click', '#edit-username', function () {
        showModal("userName");
    });

    $(document).on('click', '#edit-email', function () {
        showModal("email");
    });

    $(document).on('click', '#edit-password', function () {
        showModal("password");
    });

    $(document).on('click', '#toggle-theme-btn', function () {
        $("body").toggleClass('dark-theme');
        const currentTheme = $("body").hasClass('dark-theme') ? 'dark' : 'light';
        $("#toggle-theme-btn").text(currentTheme === 'dark' ? 'Toggle theme ☀️' : 'Toggle theme 🌕');
        localStorage.setItem('theme', currentTheme);
    });

});