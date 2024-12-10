document.addEventListener('DOMContentLoaded', () => {
    let selectedCard = null;
    let selectedValue = null;

    // Card Selection
    document.querySelectorAll('.card-category').forEach(cardBtn => {
        cardBtn.addEventListener('click', async (e) => {
            const button = e.currentTarget;
            const cardId = parseInt(button.dataset.cardId);
            const cardName = button.dataset.cardName;
            const cardLogo = button.dataset.cardLogo;
            
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
                    selectedCard = {
                        ...data.card,
                        id: cardId
                    };
                    
                    // Show the gift card forms section
                    const giftCardForms = document.getElementById('giftCardForms');
                    const valueForm = document.getElementById('valueForm');
                    if (giftCardForms && valueForm) {
                        giftCardForms.classList.remove('hidden');
                        valueForm.classList.remove('hidden');
                        if (document.getElementById('personalizationForm')) {
                            document.getElementById('personalizationForm').classList.add('hidden');
                        }
                        giftCardForms.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Error fetching card details:', error);
                alert(error.message || 'Failed to load card details. Please try again.');
            }
        });
    });

    // Value Selection
    document.querySelectorAll('.value-option').forEach(button => {
        button.addEventListener('click', () => {
            selectedValue = parseFloat(button.dataset.value);
            showPersonalizationForm();
        });
    });

    // Custom Value
    const setCustomValueBtn = document.getElementById('setCustomValue');
    const customValueInput = document.getElementById('customValue');
    if (setCustomValueBtn && customValueInput) {
        setCustomValueBtn.addEventListener('click', () => {
            const value = parseFloat(customValueInput.value);
            if (isNaN(value) || value < 10 || value > 500) {
                alert('Please enter a value between $10 and $500');
                return;
            }
            selectedValue = value;
            showPersonalizationForm();
        });
    }

    function showPersonalizationForm() {
        const personalizationForm = document.getElementById('personalizationForm');
        const valueForm = document.getElementById('valueForm');
        if (personalizationForm && valueForm) {
            valueForm.classList.add('hidden');
            personalizationForm.classList.remove('hidden');
            personalizationForm.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Handle form submission
    const giftCardForm = document.getElementById('giftCardForm');
    if (giftCardForm) {
        // Preview button click handler
        const previewButton = document.getElementById('previewButton');
        if (previewButton) {
            previewButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!selectedCard || !selectedValue) {
                    alert('Please select a gift card and value');
                    return;
                }

                // Get form values
                const recipientName = document.getElementById('recipientName').value.trim();
                const recipientEmail = document.getElementById('recipientEmail').value.trim();
                const senderName = document.getElementById('senderName').value.trim();
                const senderEmail = document.getElementById('senderEmail').value.trim();
                const message = document.getElementById('giftMessage').value.trim();

                // Validate required fields
                if (!recipientName || !recipientEmail || !senderName || !senderEmail) {
                    alert('Please fill in all required fields (Recipient Name, Recipient Email, Sender Name, and Sender Email)');
                    return;
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(recipientEmail)) {
                    alert('Please enter a valid recipient email address');
                    return;
                }
                if (!emailRegex.test(senderEmail)) {
                    alert('Please enter a valid sender email address');
                    return;
                }

                // Show preview in modal
                const previewModal = document.getElementById('previewModal');
                const previewContent = document.getElementById('previewContent');
                const modalContent = document.getElementById('previewModalContent');
                
                if (previewModal && previewContent && modalContent) {
                    // Create preview content
                    previewContent.innerHTML = `
                        <div class="design-preview design-${selectedCard.design || 'default'} relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-br from-${selectedCard.design || 'indigo'}-50 to-${selectedCard.design || 'purple'}-50 opacity-50"></div>
                            <div class="preview-content relative z-10">
                                <div class="text-center mb-6">
                                    ${selectedCard.logo ? 
                                        `<img src="/static/images/${selectedCard.logo}" alt="${selectedCard.name}" class="h-32 mx-auto mb-4 drop-shadow-lg">` :
                                        `<div class="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                                            <span class="text-5xl font-bold text-white">${selectedCard.name[0]}</span>
                                        </div>`
                                    }
                                    <h3 class="text-2xl font-bold text-gray-900">${selectedCard.name} Gift Card</h3>
                                </div>
                                
                                <div class="space-y-6">
                                    <div class="text-center">
                                        <div class="text-4xl font-bold text-indigo-600">$${selectedValue.toFixed(2)}</div>
                                    </div>
                                    
                                    <div class="border-t border-b border-gray-200 py-6 space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-500">To</label>
                                            <div class="text-lg font-medium text-gray-900">${recipientName}</div>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-500">Message</label>
                                            <div class="text-gray-700">${message || 'No message'}</div>
                                        </div>
                                        
                                        <div>
                                            <label class="block text-sm font-medium text-gray-500">From</label>
                                            <div class="text-gray-900">${senderName}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-center text-sm text-gray-500">
                                        This gift card will be sent to: ${recipientEmail}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Show modal with animation
                    previewModal.classList.remove('hidden');
                    // Wait for the next frame to ensure the transition works
                    requestAnimationFrame(() => {
                        modalContent.classList.remove('opacity-0', 'translate-y-4', 'sm:translate-y-0', 'sm:scale-95');
                        modalContent.classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
                    });
                    
                    // Function to close modal with animation
                    const closeModalWithAnimation = () => {
                        modalContent.classList.remove('opacity-100', 'translate-y-0', 'sm:scale-100');
                        modalContent.classList.add('opacity-0', 'translate-y-4', 'sm:translate-y-0', 'sm:scale-95');
                        
                        // Wait for animation to complete before hiding
                        setTimeout(() => {
                            previewModal.classList.add('hidden');
                            modalContent.classList.remove('opacity-0', 'translate-y-4', 'sm:translate-y-0', 'sm:scale-95');
                        }, 200);
                    };
                    
                    // Add close modal functionality
                    const closeButtons = previewModal.querySelectorAll('.close-modal');
                    closeButtons.forEach(button => {
                        button.addEventListener('click', closeModalWithAnimation);
                    });
                    
                    // Close modal when clicking outside
                    previewModal.addEventListener('click', (e) => {
                        if (e.target === previewModal) {
                            closeModalWithAnimation();
                        }
                    });
                    
                    // Close modal on escape key
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && !previewModal.classList.contains('hidden')) {
                            closeModalWithAnimation();
                        }
                    });

                    // Handle proceed to payment button
                    const proceedToPaymentBtn = document.getElementById('proceedToPayment');
                    if (proceedToPaymentBtn) {
                        proceedToPaymentBtn.addEventListener('click', async () => {
                            const formData = {
                                card_id: selectedCard.id,
                                value: selectedValue,
                                design: selectedCard.design || 'default',
                                recipient_name: recipientName,
                                recipient_email: recipientEmail,
                                sender_name: senderName,
                                sender_email: senderEmail,
                                message: message || ''
                            };

                            try {
                                const response = await fetch('/create_gift_card', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(formData)
                                });

                                const data = await response.json();
                                if (response.ok) {
                                    window.location.href = data.redirect_url;
                                } else {
                                    throw new Error(data.error || 'Failed to create gift card');
                                }
                            } catch (error) {
                                console.error('Error:', error);
                                alert(error.message || 'Failed to create gift card. Please try again.');
                            }
                        });
                    }
                }
            });
        }

        giftCardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedCard || !selectedValue) {
                alert('Please select a gift card and value');
                return;
            }

            const formData = {
                card_id: selectedCard.id,
                value: selectedValue,
                design: selectedCard.design || 'default',
                recipient_name: document.getElementById('recipientName').value,
                recipient_email: document.getElementById('recipientEmail').value,
                sender_name: document.getElementById('senderName').value,
                sender_email: document.getElementById('senderEmail').value,
                message: document.getElementById('giftMessage').value
            };

            try {
                const response = await fetch('/create_gift_card', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (response.ok) {
                    window.location.href = data.redirect_url;
                } else {
                    throw new Error(data.error || 'Failed to create gift card');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message || 'Failed to create gift card. Please try again.');
            }
        });
    }

    // Scroll buttons for card categories
    document.querySelectorAll('.scroll-btn').forEach(button => {
        button.addEventListener('click', () => {
            const direction = button.dataset.direction;
            const container = button.closest('.relative').querySelector('.card-scroll');
            const scrollAmount = container.offsetWidth;
            
            if (direction === 'left') {
                container.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            } else {
                container.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            }
        });
    });

    // View all cards button
    document.querySelectorAll('.view-all-btn').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            // Implement view all functionality if needed
            console.log(`View all cards in ${category}`);
        });
    });

    // Add toast close button functionality
    const closeToastButtons = document.querySelectorAll('.close-toast');
    closeToastButtons.forEach(button => {
        button.addEventListener('click', () => {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.classList.add('hidden');
            }
        });
    });
});
