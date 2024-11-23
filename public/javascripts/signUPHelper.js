$(document).ready(function(){
    $("form").on("submit", function(event){
        event.preventDefault(); // Prevent form submission

        $("#field-userName").removeClass("is-invalid");
        $("#field-email").removeClass("is-invalid");
        $("#field-password").removeClass("is-invalid");
        $("#field-confirmPassword").removeClass("is-invalid");

        $("#userPassword-error").text("");
        $("#userConfirmPassword-error").text("");
        let userName = $('#field-userName').val().trim();
        let userEmail = $("#field-email").val().trim();
        let userPassword = $("#field-password").val();
        let confirmPassword = $("#field-confirmPassword").val();

        console.log(userName, userEmail, userPassword, confirmPassword);

        if (!userName || !userEmail || !userPassword || !confirmPassword) {
            showAlert("Please fill in all fields", "danger");
            $("#field-userName").addClass("is-invalid");
            $("#field-email").addClass("is-invalid");
            $("#field-password").addClass("is-invalid");
            $("#field-confirmPassword").addClass("is-invalid");
        }

        if (userPassword !== confirmPassword) {
            showAlert("Passwords do not match", "danger");
            $("#field-password").addClass("is-invalid");
            $("#field-confirmPassword").addClass("is-invalid");
            $("#userPassword-error").text("Passwords do not match");
            $("#userConfirmPassword-error").text("Passwords do not match");
            return;
        }

        $.ajax({
            url: '/api/register',
            method: 'POST',
            data: JSON.stringify({
                userName: userName,
                userEmail: userEmail,
                userPassword: userPassword
            }),
            contentType: 'application/json',
            success: function(response) {
                if (response.message === 'User registered successfully') {
                    showAlert("Registration successful! Redirecting to homepage...", 'success');
                    setTimeout(function() {
                        window.location.href = '/home';
                    }, 3000);
                } else {
                    showAlert("Registration failed: " + response.message, 'danger');
                }
            },
            error: function(xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : "Registration failed, please try again.";
                showAlert(errorMessage, 'danger');
            }
        });
    });

    function showAlert(message, type = 'danger') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        $('#alertContainer').html(alertHtml);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            $('.alert').fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);
    }
});