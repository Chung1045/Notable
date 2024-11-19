$(document).ready(function() {
    initNewNoteBox();

    // Initialize Masonry
    var $grid = $('#container').masonry({
        itemSelector: '.note-card', // Change to class for multiple cards
        columnWidth: '.note-card',
        gutter: 20,
        fitWidth: true
    });

    // Handle delete button click
    $(document).on('click', '#icon-delete', function () {
        const noteUUID = $(this).closest('.note-card').attr('data-note-uuid');
        $('#ModalDialogue').modal('show');
        $('#btn-modal-confirm').data('noteUUID', noteUUID); // Store note UUID in modal button
        $('#btn-modal-confirm').data('action', 'delete');
    });

    // Confirm deletion
    $(document).on('click', '#btn-modal-confirm', function () {
        let noteUUID = $(this).data('noteUUID');
        if (noteUUID && $(this).data('action') === 'delete') {
            let $noteCard = $(`.note-card[data-note-uuid="${noteUUID}"]`); // Use class .note-card
            console.log("Card to remove: ", $noteCard);
            $noteCard.remove(); // Remove the note card
            $grid.masonry('layout'); // Update Masonry layout
            $('#ModalDialogue').modal('hide'); // Hide the modal
        }
    });

    function initNewNoteBox() {
        const editableDiv = $('#input-new-entry-box');

        function setPlaceholder() {
            if (editableDiv.text().trim() === '') {
                editableDiv.addClass('placeholder');
                editableDiv.text('Write a new note...');
            }
        }

        function removePlaceholder() {
            if (editableDiv.hasClass('placeholder')) {
                editableDiv.text('');
                editableDiv.removeClass('placeholder');
            }
        }

        // Initialize with placeholder if empty
        setPlaceholder();

        // Remove placeholder on focus
        editableDiv.on('focus', function () {
            removePlaceholder();
        });

        // Restore placeholder on blur if empty
        editableDiv.on('blur', function () {
            if (editableDiv.text().trim() === '') {
                setPlaceholder();
            }
        });
    }

    // Add functionality to create a note
    $('#btn-create-note').click(function() {
        const noteContent = $('#input-new-entry-box').text().trim();

        if (noteContent) {
            $.ajax({
                url: '/api/notes', // This is the API endpoint for creating a note
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    content: noteContent,
                    userUUID: 's12345' // Update this with the actual user ID
                }),
                success: function(response) {
                    // Update the UI to display the newly created note
                    $('#container').append(`
                        <div class="card note-card" data-note-uuid="${response.noteUUID}">
                            <p contenteditable="true" class="note-entry" data-note-uuid="${response.noteUUID}">${response.content}</p>
                            <div class="d-flex justify-content-end" id="div_container_action_button">
                                <i class="bi bi-trash action-icon" id="icon-delete" data-bs-toggle="tooltip" title="Delete note entry"></i>
                            </div>
                        </div>
                    `);
                    $('#input-new-entry-box').text(''); // Clear the input box
                },
                error: function(error) {
                    console.error('Error creating note:', error);
                }
            });
        } else {
            alert('Please enter some content for the note.');
        }
    });

});
