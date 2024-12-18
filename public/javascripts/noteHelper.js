$(document).ready(function () {
    initNewNoteBox();
    fetchUserInfo();
    checkNoteCount();

    let intervalId;
    let typingTimer;
    const doneTypingInterval = 1000;

    const storedTheme = localStorage.getItem('theme') || 'light';

    // Set initial theme
    $("body").toggleClass('dark-theme', storedTheme === 'dark');
    $("#toggle-theme-btn").text(storedTheme === 'dark' ? 'Toggle theme ☀️' : 'Toggle theme 🌕');

    // Initialize Masonry
    const $grid = $('#container').masonry({
        itemSelector: '.note-card', // Change to class for multiple cards
        columnWidth: '.note-card',
        gutter: 20,
        fitWidth: true
    });

    function updateGrid(){
        $grid.masonry('layout');
    }

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
        $this.addClass('edit-active');

        clearInterval(intervalId);

        intervalId = setInterval(() => {
            const noteUUID = $this.attr('data-note-uuid');
            console.log("Note UUID: ", noteUUID);
            updateNote(noteUUID, $(this).text());
        }, 5000);
    });

    $(document).on('blur', '.note-entry', function () {
        const $this = $(this);
        $this.removeClass('edit-active');
        clearInterval(intervalId);
        const noteUUID = $this.attr('data-note-uuid');
        console.log("Note UUID: ", noteUUID);
        updateNote(noteUUID, $(this).text());
    });

    $(document).on('input', '.note-entry', function () {
        updateGrid();
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

    $("#select-time-search-option").change(function() {
        let searchTerm = $("#input-search-box").val().trim();
        const period = $('#select-time-search-option').val();

        if (!searchTerm){
            searchTerm = '';
        }

        if(period === 'time-all') {
            console.log("Searching all notes");
            searchNotes(searchTerm);
        } else {
            console.log("Searching notes with time period: ", period);
            searchNotesWithPeriod(searchTerm, period);
        }

    });

    function doneTyping(searchTerm) {
        clearLayout();
        if (searchTerm) {
            $('#search-results').text(`Searching for: ${searchTerm}`).show();
        } else {
            $('#search-results').hide();
        }

        const period = $('#select-time-search-option').val();

        if(period === 'time-all') {
            console.log("Searching all notes");
            searchNotes(searchTerm);
        } else {
            console.log("Searching notes with time period: ", period);
            searchNotesWithPeriod(searchTerm, period);
        }
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
                if (response.userName && response.userEmail && response.userAuthenticateType) {
                    $("#flyout_username_value").text(response.userName);
                    $("#flyout_email_value").text(response.userEmail);
                    if (response.userAuthenticateType === "google") {
                        $("#edit-email").remove();
                        $("#edit-password").remove();
                    }
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
                    showAlert("Note not found. It may have been already deleted.", "warning");
                } else if (xhr.status === 401) {
                    showAlert("Unauthorized. Unable to perform action, please log in and try again.", "danger");
                } else {
                    showAlert("Failed to update note. Please try again.", "danger");
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
                $(`[data-note-uuid="${noteUUID}"]`).remove();
                checkNoteCount();
                showAlert("Note deleted successfully.", "success");

            },
            error: function (xhr, status, error) {
                console.error('Error deleting note:', xhr.responseText);
                // Provide more specific error messages based on the status code
                if (xhr.status === 404) {
                    showAlert("Note not found. It may have been already deleted.", "warning");
                } else if (xhr.status === 401) {
                    showAlert("Unauthorized. Unable to perform action, please log in and try again.", "danger");
                } else {
                    showAlert("Failed to delete note. Please try again.", "danger");
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
                    renderNoteCards(response.notes);
                } else {
                    console.error('Error searching notes:', response.message);
                    showAlert("Failed to search notes. Please try again.", "danger");
                }
            },
            error: function(xhr, status, error) {
                console.error('Error searching notes:', xhr.responseText);
                if (xhr.status === 401) {
                    showAlert("Unauthorized. Please log in and try again.", "danger");
                } else {
                    showAlert("Failed to search notes. Please try again.", "danger");
                }
            }
        });
    }

    function searchNotesWithPeriod(searchTerm, period) {
        $.ajax({
            url: '/api/searchNotesWithTime',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ keyword: searchTerm, timePeriod: period }),
            success: function(response) {
                if (response.success) {
                    renderNoteCards(response.notes);
                } else {
                    console.error('Error searching notes:', response.message);
                    showAlert("Failed to search notes. Please try again.", "danger");
                }
            },
            error: function(xhr, status, error) {
                console.error('Error searching notes:', xhr.responseText);
                if (xhr.status === 401) {
                    showAlert("Unauthorized. Please log in and try again.", "danger");
                } else {
                    showAlert("Failed to search notes. Please try again.", "danger");
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
                <div class="card note-card" data-note-uuid="${note.noteUUID}">
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
        }
        $grid.masonry('layout');
        checkNoteCount();
    }

    // Add functionality to create a note
    $('#btn-create-note').on("click", function () {
        const noteContent = $('#input-new-entry-box').text().trim();

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
                        showAlert("Note created successfully.", "success");
                    } else {
                        console.error('Error creating note:', response.message);
                        showAlert("Failed to create note. Please try again.", "danger");
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error creating note:', error);
                    showAlert("Failed to create note. Please try again.", "danger");
                }
            });
        } else {
            showAlert("Please enter a note content before creating a new note.", "warning");
        }
    });

    function showAlert(message, type = 'info', duration = 5000) {
        const alertId = 'alert-' + Date.now(); // Generate a unique ID for the alert
        const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade" role="alert" style="display: none;">
            ${message}
        </div>
    `;
        const $alert = $(alertHtml);
        $("#alertContainer").append($alert);

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

    $("body").fadeIn(500);
    updateGrid();


});
