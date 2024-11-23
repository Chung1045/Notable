$(document).ready(function () {
    initNewNoteBox();
    fetchUserInfo();
    checkNoteCount();

    let intervalId;
    let typingTimer;
    const doneTypingInterval = 1000;

    // Initialize Masonry
    const $grid = $('#container').masonry({
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
            deleteNote(noteUUID);
        }
    });

    $(document).on('click', '#image-userAvatar', function () {
        const duration = 400;
        $("#flyout").css('visibility', 'visible').hide().fadeIn(duration);
    });

    $(document).on('click', function(event) {
        const flyout = $("#flyout");
        const avatar = $("#image-userAvatar");

        if (!flyout.is(event.target) &&
            flyout.has(event.target).length === 0 &&
            !avatar.is(event.target) &&
            !$(event.target).hasClass('logout-btn')) {
            flyout.fadeOut(400);
        }
    });

    $(document).on('focus', '.note-entry', function () {
        const $this = $(this);

        clearInterval(intervalId);

        intervalId = setInterval(() => {
            const noteUUID = $this.attr('data-note-uuid');
            console.log("Note UUID: ", noteUUID);
            updateNote(noteUUID, $(this).text());
        }, 5000);
    });

    $(document).on('blur', '.note-entry', function () {
        const $this = $(this);
        clearInterval(intervalId);
        const noteUUID = $this.attr('data-note-uuid');
        console.log("Note UUID: ", noteUUID);
        updateNote(noteUUID, $(this).text());

    });

    $(document).on('input', "#input-search-box", function() {
        clearTimeout(typingTimer);

        const searchTerm = $(this).val().trim();
        if (searchTerm) {
            typingTimer = setTimeout(() => doneTyping(searchTerm), doneTypingInterval);
        } else {
            doneTyping('');
        }
    });

    function doneTyping(searchTerm) {
        console.log("User stopped typing. Search term:", searchTerm);
        clearLayout();
        if (searchTerm) {
            $('#search-results').text(`Searching for: ${searchTerm}`).show();
        } else {
            $('#search-results').hide();
        }
        searchNotes(searchTerm);
    }

    function checkNoteCount() {
        const noteEntry = document.querySelectorAll(".note-card");
        const $emptyMessage = $('#empty_message_div');
        const duration = 400; // Duration of the fade effect in milliseconds

        if (noteEntry.length === 0) {
            $emptyMessage.css('visibility', 'visible').hide().fadeIn(duration);
        } else {
            $emptyMessage.fadeOut(duration, function () {
                $(this).css('visibility', 'hidden');
            });
        }
    }

    function initNewNoteBox() {
        const editableDiv = $('#input-new-entry-box');
        const createButton = $('#btn-create-note');
        const fadeDuration = 400; // Duration of fade effect in milliseconds

        function setPlaceholder() {
            if (editableDiv.text().trim() === '') {
                editableDiv.addClass('placeholder');
                editableDiv.text('Write a new note...');
                createButton.fadeOut(fadeDuration);
            }
        }

        function removePlaceholder() {
            if (editableDiv.hasClass('placeholder')) {
                editableDiv.text('');
                editableDiv.removeClass('placeholder');
            }
        }


        function toggleCreateButton() {
            if (editableDiv.text().trim() !== '' && !editableDiv.hasClass('placeholder')) {
                if (!createButton.is(':visible')) {
                    createButton.fadeIn(fadeDuration);
                }
            } else {
                if (createButton.is(':visible')) {
                    createButton.fadeOut(fadeDuration);
                }
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
            toggleCreateButton();
        });

        // Check content on input
        editableDiv.on('input', function () {
            toggleCreateButton();
        });
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
                    alert('Failed to fetch user info. Please try again.');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching user info:', error);
                alert('An error occurred while fetching user info');
            }
        });
    }

    function updateNote(noteUUID, content) {
        $.ajax({
            url: `/api/notes/${noteUUID}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ content: content }),
            success: function (response) {
                console.log('Note updated successfully:', response);
            },
            error: function (xhr, status, error) {
                console.error('Error updating note:', xhr.responseText);
                if (xhr.status === 404) {
                    alert('Note not found. It may have been deleted.');
                } else if (xhr.status === 401) {
                    alert('You are not authorized to update this note.');
                } else {
                    alert('An error occurred while updating the note. Please try again.');
                }
            }
        });
    }

    function deleteNote(noteUUID) {
        $.ajax({
            url: `/api/notes/${noteUUID}`,
            type: 'DELETE',
            contentType: 'application/json',
            success: function (response) {
                console.log('Note deleted successfully:', response);
                $(`[data-note-uuid="${noteUUID}"]`).remove();
                checkNoteCount();
                alert('Note deleted successfully');

            },
            error: function (xhr, status, error) {
                console.error('Error deleting note:', xhr.responseText);
                // Provide more specific error messages based on the status code
                if (xhr.status === 404) {
                    alert('Note not found. It may have been already deleted.');
                } else if (xhr.status === 401) {
                    alert('You are not authorized to delete this note.');
                } else {
                    alert('An error occurred while deleting the note. Please try again.');
                }
            }
        });
    }

    function searchNotes(searchTerm) {
        $.ajax({
            url: '/api/searchNotes',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ keyword: searchTerm }),
            success: function(response) {
                if (response.success) {
                    console.log(`Received ${response.notes.length} notes from server`);
                    console.log(response);
                    renderNoteCards(response.notes);
                } else {
                    console.error('Error searching notes:', response.message);
                    alert('An error occurred while searching notes: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error searching notes:', xhr.responseText);
                if (xhr.status === 401) {
                    alert('You are not authenticated. Please log in and try again.');
                } else {
                    alert('An error occurred while searching notes. Please try again.');
                }
            }
        });
    }

    function clearLayout() {
        const $noteCards = $('.note-card');
        $grid.masonry('remove', $noteCards);
        $grid.masonry('layout');
        checkNoteCount();
    }

    function renderNoteCards(notes) {
        clearLayout(); // Clear existing notes from view

        if (notes.length === 0) {
            $('#search-results').text('No notes found').show();
        } else {
            $('#search-results').hide();
            notes.forEach(note => {
                const newNoteHtml = `
                <div class="card note-card" data-note-uuid="${note._id}">
                    <p contenteditable="true" class="note-entry" data-note-uuid="${note.noteUUID}">${note.noteContent}</p>
                    <div class="d-flex justify-content-end" id="div_container_action_button">
                        <i class="bi bi-trash action-icon" id="icon-delete" data-bs-toggle="tooltip" title="Delete note entry"></i>
                    </div>
                </div>
            `;
                const $newNote = $(newNoteHtml);
                $grid.prepend($newNote)
                    .masonry('prepended', $newNote);
            });

            $grid.masonry('layout');
        }

        checkNoteCount();
    }

    // Add functionality to create a note
    $('#btn-create-note').on("click", function () {
        const noteContent = $('#input-new-entry-box').text().trim();
        console.log("Note content: ", noteContent);

        if (noteContent) {
            $.ajax({
                url: '/api/notes',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    content: noteContent
                }),
                success: function (response) {
                    if (response.success) {
                        const newNoteHtml = `
                            <div class="card note-card" data-note-uuid="${response.noteUUID}">
                                <p contenteditable="true" class="note-entry" data-note-uuid="${response.noteUUID}">${noteContent}</p>
                                <div class="d-flex justify-content-end" id="div_container_action_button">
                                    <i class="bi bi-trash action-icon" id="icon-delete" data-bs-toggle="tooltip" title="Delete note entry"></i>
                                </div>
                            </div>
                        `;
                        const $newNote = $(newNoteHtml);
                        $grid.prepend($newNote)
                            .masonry('prepended', $newNote)
                            .masonry('layout');

                        checkNoteCount();
                        $('#input-new-entry-box').text('').trigger('blur');
                    } else {
                        console.error('Error creating note:', response.message);
                        alert('Failed to create note. Please try again.');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error creating note:', error);
                    alert('An error occurred while creating the note. Please try again.');
                }
            });
        } else {
            alert('Please enter some content for the note.');
        }
    });

});
