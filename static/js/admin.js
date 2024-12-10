// Function to show success message
function showSuccess(message) {
    const toast = document.getElementById('successToast');
    const messageEl = document.getElementById('successMessage');
    
    if (!toast || !messageEl) {
        console.error('Success toast elements not found');
        return;
    }
    
    messageEl.textContent = message;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
    }, 3000);
}

// Function to submit new gift card
async function submitAddCardForm() {
    try {
        // Get all form fields
        const name = document.getElementById('cardName').value.trim();
        const description = document.getElementById('cardDescription').value.trim();
        const price = document.getElementById('cardPrice').value.trim();
        const validity = document.getElementById('cardValidity').value.trim();
        const terms = document.getElementById('cardTerms').value.trim();
        const category = document.getElementById('cardCategory').value;
        const logoFile = document.getElementById('cardLogo').files[0];

        console.log('Form Data:', {
            name,
            description,
            price,
            validity,
            terms,
            category
        });

        // Validate required fields
        if (!name) {
            alert('Please enter a name for the gift card');
            return;
        }

        if (!category || category === '') {
            alert('Please select a category');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('category_id', category); // Changed from 'category' to 'category_id' to match backend
        formData.append('description', description);
        formData.append('price', parseFloat(price) || 0);
        formData.append('validity', parseInt(validity) || 30);
        formData.append('terms', terms);

        if (logoFile) {
            formData.append('logo', logoFile);
        }

        console.log('Sending request to /admin/card/add');
        const response = await fetch('/admin/card/add', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        console.log('Server response:', result);

        if (response.ok) {
            showSuccess('Gift card added successfully!');
            document.getElementById('addCardModal').classList.add('hidden');
            setTimeout(() => location.reload(), 1000);
        } else {
            alert(result.error || 'Failed to add gift card');
        }
    } catch (error) {
        console.error('Error in submitAddCardForm:', error);
        alert('Failed to add gift card: ' + error.message);
    }
}

// Function to open edit modal and populate fields
function openEditModal(cardId, name, description, price, validity, terms, categoryId) {
    document.getElementById('editCardId').value = cardId;
    document.getElementById('editCardName').value = name;
    document.getElementById('editCardDescription').value = description || '';
    document.getElementById('editCardPrice').value = price || '';
    document.getElementById('editCardValidity').value = validity || '';
    document.getElementById('editCardTerms').value = terms || '';
    document.getElementById('editCardCategory').value = categoryId || '';
    
    document.getElementById('editCardModal').classList.remove('hidden');
}

// Function to submit edit form
async function submitEditCardForm() {
    try {
        const cardId = document.getElementById('editCardId').value;
        const name = document.getElementById('editCardName').value.trim();
        const description = document.getElementById('editCardDescription').value.trim();
        const price = document.getElementById('editCardPrice').value.trim();
        const validity = document.getElementById('editCardValidity').value.trim();
        const terms = document.getElementById('editCardTerms').value.trim();
        const category = document.getElementById('editCardCategory').value;

        // Validate required fields
        if (!name) {
            alert('Please enter a name for the gift card');
            return;
        }

        if (!category || category === '') {
            alert('Please select a category');
            return;
        }

        const cardData = {
            name,
            category_id: parseInt(category),
            description,
            price: parseFloat(price) || 0,
            validity: parseInt(validity) || 30,
            terms
        };

        const response = await fetch(`/admin/card/${cardId}/edit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cardData)
        });

        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Gift card updated successfully!');
            document.getElementById('editCardModal').classList.add('hidden');
            setTimeout(() => location.reload(), 1000);
        } else {
            alert(result.error || 'Failed to update gift card');
        }
    } catch (error) {
        console.error('Error in submitEditCardForm:', error);
        alert('Failed to update gift card: ' + error.message);
    }
}

// Function to delete a gift card
async function deleteCard(cardId) {
    if (!confirm('Are you sure you want to delete this gift card?')) {
        return;
    }

    try {
        const response = await fetch(`/admin/card/${cardId}/delete`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Gift card deleted successfully!');
            setTimeout(() => location.reload(), 1000);
        } else {
            alert(result.error || 'Failed to delete gift card');
        }
    } catch (error) {
        console.error('Error deleting gift card:', error);
        alert('Failed to delete gift card: ' + error.message);
    }
}

// Function to submit edit category form
async function submitEditCategoryForm() {
    try {
        const categoryId = document.getElementById('editCategoryId').value;
        const newName = document.getElementById('editCategoryName').value.trim();
        
        if (!newName) {
            alert('Category name is required');
            return;
        }

        const response = await fetch(`/admin/category/${categoryId}/edit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        });
        
        if (response.ok) {
            showSuccess('Category updated successfully!');
            document.getElementById('editCategoryModal').classList.add('hidden');
            setTimeout(() => location.reload(), 1000);
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to update category');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to update category');
    }
}

// Initialize event listeners when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Category Management
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', async function() {
            const categoryName = document.getElementById('categoryName').value;
            
            try {
                const response = await fetch('/admin/category/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: categoryName })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showSuccess('Category added successfully!');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    alert(data.error || 'Failed to add category');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to add category');
            }
        });
    }

    // Edit Category
    document.querySelectorAll('.edit-category').forEach(button => {
        button.addEventListener('click', function() {
            const categoryId = this.dataset.id;
            const categoryName = this.closest('tr').querySelector('td').textContent.trim();
            
            // Populate and show edit modal
            document.getElementById('editCategoryId').value = categoryId;
            document.getElementById('editCategoryName').value = categoryName;
            document.getElementById('editCategoryModal').classList.remove('hidden');
        });
    });

    // Delete Category
    document.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', async function() {
            const categoryId = this.dataset.id;
            
            if (!confirm('Are you sure you want to delete this category?')) {
                return;
            }

            try {
                const response = await fetch(`/admin/category/${categoryId}/delete`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    showSuccess('Category deleted successfully!');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    const data = await response.json();
                    alert(data.error || 'Failed to delete category');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to delete category');
            }
        });
    });

    // Gift Card Management
    const saveCardBtn = document.getElementById('saveCardBtn');
    if (saveCardBtn) {
        saveCardBtn.addEventListener('click', submitAddCardForm);
    }

    // Handle edit form submission
    const saveEditCardBtn = document.getElementById('saveEditCardBtn');
    if (saveEditCardBtn) {
        saveEditCardBtn.addEventListener('click', submitEditCardForm);
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const modals = [
            document.getElementById('addCategoryModal'),
            document.getElementById('addCardModal'),
            document.getElementById('editCardModal'),
            document.getElementById('editCategoryModal')
        ];
        
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
});

// Make these functions accessible globally
window.submitAddCardForm = submitAddCardForm;
window.submitEditCategoryForm = submitEditCategoryForm;
