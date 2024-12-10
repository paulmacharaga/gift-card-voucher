document.addEventListener('DOMContentLoaded', function() {
    let selectedCard = null;
    let selectedValue = null;

    // Handle card selection
    document.querySelectorAll('.card-category').forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all cards
            document.querySelectorAll('.card-category').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected card
            this.classList.add('active');
            
            // Store selected card data
            const cardId = parseInt(this.dataset.cardId, 10);
            const cardName = this.dataset.cardName;
            const cardLogo = this.dataset.cardLogo;
            
            console.log('Selected card:', { id: cardId, name: cardName, logo: cardLogo });
            
            selectedCard = {
                id: cardId,
                name: cardName,
                logo: cardLogo
            };
            
            // Show value section
            document.getElementById('categorySection').style.display = 'none';
            document.getElementById('giftCardForms').style.display = 'block';
            document.getElementById('valueSection').style.display = 'block';
        });
    });

    // Handle value selection
    document.querySelectorAll('.value-option').forEach(button => {
        button.addEventListener('click', function() {
            selectedValue = parseFloat(this.dataset.value);
            document.getElementById('valueSection').style.display = 'none';
            document.getElementById('personalizationForm').style.display = 'block';
        });
    });

    // Handle custom value input
    const customValueInput = document.getElementById('customValue');
    if (customValueInput) {
        customValueInput.addEventListener('input', function() {
            selectedValue = parseFloat(this.value) || 0;
        });
    }

    // Handle back to value button
    const backToValueBtn = document.getElementById('backToValue');
    if (backToValueBtn) {
        backToValueBtn.addEventListener('click', function() {
            document.getElementById('personalizationForm').style.display = 'none';
            document.getElementById('valueSection').style.display = 'block';
        });
    }

    // Handle back to categories button
    const backToCategoriesBtn = document.getElementById('backToCategories');
    if (backToCategoriesBtn) {
        backToCategoriesBtn.addEventListener('click', function() {
            document.getElementById('giftCardForms').style.display = 'none';
            document.getElementById('categorySection').style.display = 'block';
        });
    }

    // Function to update preview
    function updatePreview() {
        const previewContainer = document.getElementById('previewContent');
        if (previewContainer) {
            const recipientName = document.getElementById('recipientName').value || 'Recipient Name';
            const message = document.getElementById('giftMessage').value || 'Your message here';
            const value = selectedValue ? selectedValue.toFixed(2) : '0.00';

            previewContainer.innerHTML = `
                <div class="gift-card-preview p-6">
                    ${selectedCard && selectedCard.logo ? `
                        <img src="/static/images/${selectedCard.logo}" 
                             alt="${selectedCard.name}" 
                             class="max-h-24 mx-auto mb-4">
                    ` : ''}
                    <h3 class="text-xl font-bold mb-4">${selectedCard ? selectedCard.name : ''} Gift Card</h3>
                    <div class="space-y-4">
                        <p><strong>Amount:</strong> $${value}</p>
                        <p><strong>To:</strong> ${recipientName}</p>
                        <p><strong>Message:</strong><br>${message}</p>
                    </div>
                </div>
            `;
        }
    }

    // Handle preview button click
    const previewButton = document.getElementById('previewButton');
    if (previewButton) {
        previewButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            updatePreview();
        });
    }

    // Add live preview updates for form changes
    const formInputs = document.querySelectorAll('#giftCardForm input, #giftCardForm textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', updatePreview);
    });

    // Initial preview update
    updatePreview();

    // Handle preview gift card in modal
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
        previewModal.addEventListener('click', function(e) {
            if (e.target === previewModal) {
                previewModal.classList.add('hidden');
            }
        });

        // Close modal with close button
        const closeButton = previewModal.querySelector('button');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                previewModal.classList.add('hidden');
            });
        }
    }

    // Function to handle user gift card creation
    async function createUserGiftCard(event) {
        event.preventDefault();
        
        try {
            const formData = {
                card_id: selectedCard.id,
                value: selectedValue,
                recipient_name: document.getElementById('recipientName').value,
                recipient_email: document.getElementById('recipientEmail').value,
                sender_name: document.getElementById('senderName').value,
                sender_email: document.getElementById('senderEmail').value,
                message: document.getElementById('giftMessage').value,
            };

            // Validate required fields
            for (const [key, value] of Object.entries(formData)) {
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    alert(`Please fill in all required fields (${key.replace('_', ' ')})`);
                    return;
                }
            }

            const response = await fetch('/create_gift_card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                // Store gift card data in session storage for payment
                sessionStorage.setItem('pendingGiftCard', JSON.stringify(result.gift_card));
                // Redirect to payment page
                window.location.href = '/payment';
            } else {
                alert(result.error || 'Failed to create gift card');
            }
        } catch (error) {
            console.error('Error creating gift card:', error);
            alert('Failed to create gift card. Please try again.');
        }
    }

    // Initialize form
    const giftCardForm = document.getElementById('giftCardForm');
    if (giftCardForm) {
        giftCardForm.addEventListener('submit', createUserGiftCard);
    }
});
