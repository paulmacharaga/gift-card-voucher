document.addEventListener('DOMContentLoaded', () => {
    let selectedCard = null;
    let selectedValue = null;

    // Get all section elements
    const sections = {
        category: document.getElementById('categorySection'),
        giftCardForms: document.getElementById('giftCardForms'),
        value: document.getElementById('valueSection'),
        personalization: document.getElementById('personalizationForm')
    };

    // Verify all sections exist
    Object.entries(sections).forEach(([name, element]) => {
        if (!element) {
            console.error(`Missing section element: ${name}`);
        }
    });

    // Back to Category Selection
    function showCategorySection() {
        sections.category.style.display = 'block';
        sections.giftCardForms.style.display = 'none';
        sections.value.style.display = 'none';
        sections.personalization.style.display = 'none';
        
        // Reset selected data
        selectedCard = null;
        selectedValue = null;

        // Scroll to categories section
        document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
    }

    // Show Value Selection
    function showValueSection() {
        sections.category.style.display = 'none';
        sections.giftCardForms.style.display = 'block';
        sections.value.style.display = 'block';
        sections.personalization.style.display = 'none';

        // Scroll to forms section
        sections.giftCardForms.scrollIntoView({ behavior: 'smooth' });
    }

    // Show Personalization
    function showPersonalizationSection() {
        sections.category.style.display = 'none';
        sections.giftCardForms.style.display = 'block';
        sections.value.style.display = 'none';
        sections.personalization.style.display = 'block';

        // Scroll to personalization section
        sections.personalization.scrollIntoView({ behavior: 'smooth' });
    }

    // Category Selection
    document.querySelectorAll('.card-category').forEach(cardBtn => {
        cardBtn.addEventListener('click', async (e) => {
            const button = e.currentTarget;
            const cardId = parseInt(button.dataset.cardId);
            
            try {
                const response = await fetch('/get_card_details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ card_id: cardId })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to load card details');
                }
                
                if (data.status === 'success' && data.card) {
                    selectedCard = data.card;
                    
                    // Update the selected card display
                    document.getElementById('selectedCardName').textContent = data.card.name;
                    document.getElementById('selectedCardDescription').textContent = data.card.description || 'Gift card for ' + data.card.name;
                    
                    // Update logo if available
                    const logoImg = document.getElementById('selectedCardLogo');
                    if (data.card.logo) {
                        logoImg.src = data.card.logo;
                        logoImg.style.display = 'block';
                    } else {
                        logoImg.style.display = 'none';
                    }
                    
                    showValueSection();
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Error fetching card details:', error);
                alert(error.message || 'Failed to load card details. Please try again.');
            }
        });
    });

    // Back Button for Value Section
    const backToCategoryBtn = document.getElementById('backToCategory');
    if (backToCategoryBtn) {
        backToCategoryBtn.addEventListener('click', showCategorySection);
    }

    // Value Selection
    const proceedToPersonalizationBtn = document.getElementById('proceedToPersonalization');
    if (proceedToPersonalizationBtn) {
        proceedToPersonalizationBtn.addEventListener('click', () => {
            const valueInput = document.getElementById('cardValue');
            if (!valueInput) return;

            const value = parseFloat(valueInput.value);
            if (isNaN(value) || value < 10 || value > 500) {
                alert('Please enter a value between $10 and $500');
                return;
            }

            selectedValue = value;
            showPersonalizationSection();
        });
    }

    // Back Button for Personalization Section
    const backToValueBtn = document.getElementById('backToValue');
    if (backToValueBtn) {
        backToValueBtn.addEventListener('click', showValueSection);
    }

    // Design Selection
    document.querySelectorAll('input[name="cardDesign"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.design-option').forEach(img => {
                if (img) img.style.border = 'none';
            });
            const selectedImg = e.target.nextElementSibling;
            if (selectedImg) selectedImg.style.border = '3px solid #007bff';
        });
    });

    // Handle design selection
    const designInputs = document.querySelectorAll('input[name="cardDesign"]');
    const designLabels = document.querySelectorAll('.design-label');

    designInputs.forEach((input, index) => {
        input.addEventListener('change', () => {
            // Update preview if it exists
            const previewContent = document.getElementById('previewContent');
            if (previewContent) {
                const selectedStyle = input.closest('.design-label').querySelector('.design-style').textContent.trim();
                updatePreviewDesign(input.value, selectedStyle);
            }
        });

        // Set initial selection
        if (index === 0) {
            input.checked = true;
            const event = new Event('change');
            input.dispatchEvent(event);
        }
    });

    function updatePreviewDesign(designId, styleText) {
        const designPreview = document.querySelector('.design-preview');
        if (designPreview) {
            designPreview.innerHTML = `
                <div class="selected-design p-3 text-center">
                    <div class="design-icon mb-2">
                        <i class="fas fa-gift"></i>
                    </div>
                    <h6 class="mb-1">${designId}</h6>
                    <small class="text-muted">${styleText}</small>
                </div>
            `;
        }
    }

    // Handle contact method toggling
    function setupContactToggle(type) {
        const emailRadio = document.getElementById(`${type}Email`);
        const phoneRadio = document.getElementById(`${type}Phone`);
        const emailField = document.getElementById(`${type}EmailField`);
        const phoneField = document.getElementById(`${type}PhoneField`);
        const emailInput = document.getElementById(`${type}EmailInput`);
        const phoneInput = document.getElementById(`${type}PhoneInput`);

        function toggleFields(showEmail) {
            if (showEmail) {
                emailField.classList.remove('d-none');
                phoneField.classList.add('d-none');
                emailInput.setAttribute('required', '');
                phoneInput.removeAttribute('required');
            } else {
                emailField.classList.add('d-none');
                phoneField.classList.remove('d-none');
                emailInput.removeAttribute('required');
                phoneInput.setAttribute('required', '');
            }
        }

        emailRadio.addEventListener('change', () => toggleFields(true));
        phoneRadio.addEventListener('change', () => toggleFields(false));
    }

    setupContactToggle('recipient');
    setupContactToggle('sender');

    // Phone number formatting
    function formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }
        input.value = value;
    }

    // Add phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => formatPhoneNumber(e.target));
    });

    // Form validation
    function validateContact(type) {
        const contactType = document.querySelector(`input[name="${type}ContactType"]:checked`).value;
        const emailInput = document.getElementById(`${type}EmailInput`);
        const phoneInput = document.getElementById(`${type}PhoneInput`);
        
        if (contactType === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(emailInput.value);
        } else {
            const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
            return phoneRegex.test(phoneInput.value);
        }
    }

    // Preview Gift Card in Modal
    const previewGiftCardBtn = document.getElementById('previewGiftCard');
    if (previewGiftCardBtn) {
        previewGiftCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get form values
            const recipientName = document.getElementById('recipientName').value;
            const senderName = document.getElementById('senderName').value;
            const cardValue = document.getElementById('cardValue').value;
            const giftMessage = document.getElementById('giftMessage').value;

            // Validate required fields
            if (!recipientName || !senderName) {
                alert('Please enter both recipient and sender names');
                return;
            }

            if (!selectedCard) {
                alert('Please select a gift card first');
                return;
            }

            // Update preview content
            document.querySelector('.gift-amount').textContent = `$${cardValue}`;
            document.querySelector('.gift-message').textContent = giftMessage || 'No message';
            document.querySelector('.recipient-name').textContent = recipientName || 'Recipient';
            document.querySelector('.sender-name').textContent = senderName || 'Sender';

            // Update company details
            const previewLogo = document.getElementById('previewCardLogo');
            const previewCompanyName = document.getElementById('previewCompanyName');
            
            if (selectedCard.logo) {
                previewLogo.src = selectedCard.logo;
                previewLogo.style.display = 'block';
            } else {
                previewLogo.style.display = 'none';
            }
            
            previewCompanyName.textContent = selectedCard.name;

            // Show the modal
            const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
            previewModal.show();
        });
    }

    // Handle modal close
    document.querySelectorAll('[data-bs-dismiss="modal"]').forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.getElementById('previewModal');
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
        });
    });

    // Handle confirmation from modal
    const confirmGiftCardModal = document.getElementById('confirmGiftCardModal');
    if (confirmGiftCardModal) {
        confirmGiftCardModal.addEventListener('click', () => {
            const modal = document.getElementById('previewModal');
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            
            // Show success message or redirect to payment
            alert('Proceeding to payment...');
            // Add your payment/confirmation logic here
        });
    }

    // Handle confirmation from modal
    const confirmGiftCardBtn = document.getElementById('confirmGiftCard');
    if (confirmGiftCardBtn) {
        confirmGiftCardBtn.addEventListener('click', () => {
            alert('Gift Card Purchased Successfully!');
            // In a real app, this would trigger payment processing
            // and generate a unique gift card code
            window.location.reload(); // Reset the flow
        });
    }

    // Form interaction handling
    const giftCardForm = document.getElementById('giftCardForms');
    const formSections = document.querySelectorAll('.form-section');
    const formInputs = giftCardForm.querySelectorAll('input, textarea, select');

    // Add active class when form is being interacted with
    formInputs.forEach(input => {
        input.addEventListener('focus', () => {
            giftCardForm.classList.add('active');
            // Add active-section class to the parent form-section
            const section = input.closest('.form-section');
            if (section) {
                formSections.forEach(s => s.classList.remove('active-section'));
                section.classList.add('active-section');
            }
        });

        input.addEventListener('blur', () => {
            // Only remove active class if no other inputs are focused
            if (!document.activeElement || !giftCardForm.contains(document.activeElement)) {
                giftCardForm.classList.remove('active');
                formSections.forEach(s => s.classList.remove('active-section'));
            }
        });
    });

    // Add hover effect for form sections
    formSections.forEach(section => {
        section.addEventListener('mouseenter', () => {
            section.style.transform = 'translateY(-5px)';
        });

        section.addEventListener('mouseleave', () => {
            section.style.transform = 'translateY(0)';
        });
    });
});
