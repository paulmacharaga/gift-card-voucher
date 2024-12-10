document.addEventListener('DOMContentLoaded', function() {
    // Function to update preview
    function updatePreview() {
        const previewContainer = document.getElementById('designPreview');
        if (previewContainer) {
            const recipientName = document.getElementById('recipientName').value || 'Recipient Name';
            const message = document.getElementById('message').value || 'Your message here';
            const value = document.getElementById('giftCardValue').value || '0.00';
            const selectedDesign = document.querySelector('input[name="design"]:checked');
            const designValue = selectedDesign ? selectedDesign.value : 'classic';

            // Update preview based on selected design
            previewContainer.className = `design-preview design-${designValue} border rounded-lg p-6 bg-gray-50`;
            
            previewContainer.innerHTML = `
                <div class="preview-content">
                    <h3>To: ${recipientName}</h3>
                    <p class="message">${message}</p>
                    <div class="value">$${parseFloat(value).toFixed(2)}</div>
                </div>
            `;
        }
    }

    // Initialize event listeners
    const createGiftCardForm = document.getElementById('createGiftCardForm');
    if (createGiftCardForm) {
        // Handle form submission
        createGiftCardForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            try {
                const formData = {
                    card_id: document.getElementById('cardId').value,
                    value: document.getElementById('giftCardValue').value,
                    recipient_name: document.getElementById('recipientName').value,
                    recipient_email: document.getElementById('recipientEmail').value,
                    sender_name: document.getElementById('senderName').value,
                    sender_email: document.getElementById('senderEmail').value,
                    message: document.getElementById('message').value,
                    design: document.querySelector('input[name="design"]:checked').value
                };

                // Validate required fields
                for (const [key, value] of Object.entries(formData)) {
                    if (!value || value.trim() === '') {
                        alert(`Please fill in all required fields (${key.replace('_', ' ')})`);
                        return;
                    }
                }

                // Submit form
                fetch('/create_gift_card', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                .then(response => response.json())
                .then(result => {
                    if (result.status === 'success') {
                        // Store gift card data in session storage for payment
                        sessionStorage.setItem('pendingGiftCard', JSON.stringify(result.gift_card));
                        // Redirect to payment page
                        window.location.href = '/payment';
                    } else {
                        alert(result.error || 'Failed to create gift card');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to create gift card');
                });
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to create gift card');
            }
        });

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
        const formInputs = document.querySelectorAll('#createGiftCardForm input, #createGiftCardForm textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        // Update preview when design changes
        const designInputs = document.querySelectorAll('input[name="design"]');
        designInputs.forEach(input => {
            input.addEventListener('change', updatePreview);
        });

        // Initial preview update
        updatePreview();
    }
});
