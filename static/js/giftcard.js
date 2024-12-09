document.addEventListener('DOMContentLoaded', () => {
    let selectedCard = null;
    let selectedValue = null;
    let giftCardModal = null;

    // Initialize Bootstrap modal
    const modalElement = document.getElementById('giftCardModal');
    if (modalElement) {
        giftCardModal = new bootstrap.Modal(modalElement);
    }

    // Get all section elements
    const sections = {
        category: document.getElementById('categories'),
        categorySection: document.getElementById('categorySection'),
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
        sections.categorySection.style.display = 'block';
        sections.giftCardForms.style.display = 'none';
        sections.value.style.display = 'none';
        sections.personalization.style.display = 'none';
        
        // Reset selected data
        selectedCard = null;
        selectedValue = null;

        // Scroll to categories section
        sections.category.scrollIntoView({ behavior: 'smooth' });
    }

    // Show Value Selection
    function showValueSection() {
        sections.categorySection.style.display = 'none';
        sections.giftCardForms.style.display = 'block';
        sections.value.style.display = 'block';
        sections.personalization.style.display = 'none';

        // Scroll to forms section
        sections.giftCardForms.scrollIntoView({ behavior: 'smooth' });
    }

    // Show Personalization
    function showPersonalizationSection() {
        sections.categorySection.style.display = 'none';
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
            
            const recipientName = document.getElementById('recipientName').value;
            const senderName = document.getElementById('senderName').value;
            const personalMessage = document.getElementById('personalMessage')?.value;
            const selectedDesign = document.querySelector('input[name="cardDesign"]:checked');

            // Validate required fields
            if (!recipientName || !senderName || !personalMessage || !selectedDesign) {
                alert('Please fill in all required fields');
                return;
            }

            // Validate contact information
            if (!validateContact('recipient')) {
                alert('Please enter valid recipient contact information');
                return;
            }

            if (!validateContact('sender')) {
                alert('Please enter valid sender contact information');
                return;
            }

            // Get contact information
            function getContactInfo(type) {
                const contactType = document.querySelector(`input[name="${type}ContactType"]:checked`).value;
                return contactType === 'email' 
                    ? document.getElementById(`${type}EmailInput`).value
                    : document.getElementById(`${type}PhoneInput`).value;
            }

            const recipientContact = getContactInfo('recipient');
            const senderContact = getContactInfo('sender');

            // Update modal preview content
            document.getElementById('modalPreviewValue').textContent = selectedValue || '50';
            document.getElementById('modalPreviewMessage').textContent = personalMessage;
            document.getElementById('modalPreviewSender').textContent = senderName;
            document.getElementById('modalPreviewRecipient').textContent = recipientName;
            document.getElementById('modalPreviewContact').textContent = `Contact: ${recipientContact}`;
            
            // Generate card number
            document.getElementById('modalPreviewCardNumber').textContent = 
                Array.from({length: 4}, () => Math.floor(Math.random() * 10000).toString().padStart(4, '0')).join('-');
            
            // Set expiry date
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            document.getElementById('modalPreviewExpiry').textContent = expiryDate.toLocaleDateString();

            // Show the modal using Bootstrap's modal API
            const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
            previewModal.show();
        });
    }

    // Handle confirmation from modal
    const confirmGiftCardModal = document.getElementById('confirmGiftCardModal');
    if (confirmGiftCardModal) {
        confirmGiftCardModal.addEventListener('click', () => {
            // Hide the modal
            const previewModal = bootstrap.Modal.getInstance(document.getElementById('previewModal'));
            previewModal.hide();
            
            // Show success message or redirect to payment
            alert('Proceeding to payment...');
            // Add your payment/confirmation logic here
        });
    }

    // Confirm Gift Card
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

    // Initialize modal navigation
    document.querySelectorAll('[data-bs-toggle="modal"]').forEach(button => {
        button.addEventListener('click', () => {
            showCategorySection();
        });
    });

    // Make navigation functions available globally
    window.showCategorySection = showCategorySection;
    window.showValueSection = showValueSection;
    window.showPersonalizationSection = showPersonalizationSection;

    // Gift Card Modal Navigation Functions
    function showModalCategorySection() {
        document.getElementById('modalCategorySection').style.display = 'block';
        document.getElementById('modalGiftCardForms').style.display = 'none';
    }

    function showModalValueSection() {
        document.getElementById('modalCategorySection').style.display = 'none';
        document.getElementById('modalGiftCardForms').style.display = 'block';
        document.getElementById('modalValueSection').style.display = 'block';
        document.getElementById('modalPersonalizationForm').style.display = 'none';
    }

    function showModalPersonalizationSection() {
        document.getElementById('modalValueSection').style.display = 'none';
        document.getElementById('modalPersonalizationForm').style.display = 'block';
    }

    // Initialize Bootstrap Modal
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize all modals
        var modals = document.querySelectorAll('.modal');
        modals.forEach(function(modal) {
            new bootstrap.Modal(modal);
        });

        // Contact Method Toggle Handlers
        setupContactToggle('recipient');
        setupContactToggle('sender');

        // Message Character Counter
        setupMessageCounter();

        // Preview Card Handler
        setupPreviewCard();

        // Category Selection Handler for both hero and modal
        setupCategorySelection();
        setupHeroCategories();
    });

    function setupContactToggle(prefix) {
        const emailRadio = document.getElementById(prefix + 'Email');
        const phoneRadio = document.getElementById(prefix + 'Phone');
        const emailField = document.getElementById(prefix + 'EmailField');
        const phoneField = document.getElementById(prefix + 'PhoneField');

        function toggleFields() {
            if (emailRadio.checked) {
                emailField.classList.remove('d-none');
                phoneField.classList.add('d-none');
                document.getElementById(prefix + 'PhoneInput').removeAttribute('required');
                document.getElementById(prefix + 'EmailInput').setAttribute('required', 'required');
            } else {
                emailField.classList.add('d-none');
                phoneField.classList.remove('d-none');
                document.getElementById(prefix + 'EmailInput').removeAttribute('required');
                document.getElementById(prefix + 'PhoneInput').setAttribute('required', 'required');
            }
        }

        emailRadio.addEventListener('change', toggleFields);
        phoneRadio.addEventListener('change', toggleFields);
    }

    function setupMessageCounter() {
        const messageInput = document.getElementById('personalMessage');
        const charCount = document.getElementById('messageCharCount');

        messageInput.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count > 200) {
                this.value = this.value.substring(0, 200);
                charCount.textContent = '200';
            }
        });
    }

    function setupPreviewCard() {
        const previewButton = document.getElementById('previewGiftCard');
        
        previewButton.addEventListener('click', function() {
            // Update preview modal with current values
            document.getElementById('previewValue').textContent = document.getElementById('cardValue').value;
            document.getElementById('previewMessage').textContent = document.getElementById('personalMessage').value;
            document.getElementById('previewSender').textContent = document.getElementById('senderName').value;
            document.getElementById('previewRecipient').textContent = document.getElementById('recipientName').value;

            // Generate random card number and expiry date for demo
            document.getElementById('previewCardNumber').textContent = generateCardNumber();
            document.getElementById('previewExpiry').textContent = generateExpiryDate();

            // Update contact information
            updatePreviewContact();
        });
    }

    function setupCategorySelection() {
        const categoryButtons = document.querySelectorAll('.card-category');
        
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                selectCategory(this);
            });
        });
    }

    function setupHeroCategories() {
        const heroCategories = document.querySelectorAll('.hero-category');
        
        heroCategories.forEach(button => {
            button.addEventListener('click', function() {
                // Show modal
                const giftCardModal = new bootstrap.Modal(document.getElementById('giftCardModal'));
                giftCardModal.show();
                
                // Find corresponding category in modal and select it
                const categoryId = this.dataset.cardId;
                const modalCategory = document.querySelector(`.card-category[data-card-id="${categoryId}"]`);
                if (modalCategory) {
                    selectCategory(modalCategory);
                }
            });
        });
    }

    function selectCategory(categoryButton) {
        // Remove active class from all buttons
        const allCategoryButtons = document.querySelectorAll('.card-category');
        allCategoryButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        categoryButton.classList.add('active');
        
        // Store selected card data
        const cardId = categoryButton.dataset.cardId;
        const cardName = categoryButton.dataset.cardName;
        
        // Proceed to value section
        showModalValueSection();
    }

    function generateCardNumber() {
        return 'XXXX-XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000);
    }

    function generateExpiryDate() {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function updatePreviewContact() {
        const previewContact = document.getElementById('previewContact');
        const recipientName = document.getElementById('recipientName').value;
        let contactInfo = '';

        if (document.getElementById('recipientEmail').checked) {
            contactInfo = document.getElementById('recipientEmailInput').value;
        } else {
            contactInfo = document.getElementById('recipientPhoneInput').value;
        }

        previewContact.innerHTML = `
            <p><strong>${recipientName}</strong><br>
            ${contactInfo}</p>
        `;
    }

    // Confirm Gift Card Handler
    document.getElementById('confirmGiftCard').addEventListener('click', function() {
        // Here you would typically submit the form data to your backend
        alert('Thank you for your purchase! Your gift card will be sent shortly.');
        
        // Close both modals
        const previewModal = bootstrap.Modal.getInstance(document.getElementById('previewModal'));
        const giftCardModal = bootstrap.Modal.getInstance(document.getElementById('giftCardModal'));
        
        previewModal.hide();
        giftCardModal.hide();
        
        // Reset form
        resetForm();
    });

    function resetForm() {
        // Reset all form fields
        document.getElementById('recipientName').value = '';
        document.getElementById('recipientEmailInput').value = '';
        document.getElementById('recipientPhoneInput').value = '';
        document.getElementById('senderName').value = '';
        document.getElementById('senderEmailInput').value = '';
        document.getElementById('senderPhoneInput').value = '';
        document.getElementById('personalMessage').value = '';
        document.getElementById('cardValue').value = '50';
        
        // Reset radio buttons
        document.getElementById('recipientEmail').checked = true;
        document.getElementById('senderEmail').checked = true;
        
        // Reset contact fields visibility
        document.getElementById('recipientEmailField').classList.remove('d-none');
        document.getElementById('recipientPhoneField').classList.add('d-none');
        document.getElementById('senderEmailField').classList.remove('d-none');
        document.getElementById('senderPhoneField').classList.add('d-none');
        
        // Reset character counter
        document.getElementById('messageCharCount').textContent = '0';
        
        // Reset sections visibility
        showModalCategorySection();
    }
});
