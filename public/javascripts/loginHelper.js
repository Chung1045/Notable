$(document).ready(function () {
    $(".btn-login").on("click", function (event) {
        event.preventDefault();
        let userEmail = $("#field-userEmail").val();
        let userPassword = $("#field-password").val();

        if (!userEmail || !userPassword) {
            showAlert("Please fill in all fields", "danger");
            return;
        }

        showAlert("Logging in...", "info");

        $.ajax({
            url: '/api/login',
            method: 'POST',
            data: JSON.stringify({
                userEmail: userEmail,
                userPassword: userPassword
            }),
            contentType: 'application/json',
            success: function (response) {
                showAlert(response.message, 'success');
                setTimeout(function () {
                    window.location.href = '/home';
                }, 3000);
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message
                    ? xhr.responseJSON.message
                    : "An error occurred. Please try again.";
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
            $('.alert').fadeOut(300, function () {
                $(this).remove();
            });
        }, 5000);
    }
});