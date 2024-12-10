from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_from_directory, session
from flask_cors import CORS
from functools import wraps
import uuid
import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import json
import time

app = Flask(__name__)
CORS(app)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False

# File upload configuration
UPLOAD_FOLDER = os.path.join(app.static_folder, 'images')
DATA_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
GIFT_CARDS_FILE = os.path.join(DATA_FOLDER, 'gift_cards.json')
TOTAL_STATS_FILE = os.path.join(DATA_FOLDER, 'total_stats.json')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

# Load gift card data from JSON file
def load_gift_cards():
    try:
        print("Attempting to load gift cards...")
        if os.path.exists(GIFT_CARDS_FILE):
            print(f"Gift cards file exists at {GIFT_CARDS_FILE}")
            with open(GIFT_CARDS_FILE, 'r') as f:
                data = json.load(f)
                categories = data.get('categories', [])
                print(f"Loaded categories: {json.dumps(categories, indent=2)}")
                
                # Ensure each category has an ID
                for i, category in enumerate(categories, start=1):
                    if 'id' not in category:
                        category['id'] = i
                
                if not categories:
                    print("No categories found, initializing defaults")
                    categories = init_default_categories()
                
                # Save the updated categories with IDs
                save_gift_cards(categories)
                return categories
                
        print("Gift cards file does not exist, initializing defaults")
        return init_default_categories()
    except Exception as e:
        print(f"Error loading gift cards: {str(e)}")
        return init_default_categories()

# Save gift card data to JSON file
def save_gift_cards(categories):
    try:
        with open(GIFT_CARDS_FILE, 'w') as f:
            json.dump({'categories': categories}, f, indent=4)
    except Exception as e:
        print(f"Error saving gift cards: {str(e)}")

# Load and save functions for total statistics
def load_total_stats():
    try:
        with open(TOTAL_STATS_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        default_stats = {
            "total_generated_value": 0,
            "total_transactions": 0,
            "last_updated": datetime.now().isoformat()
        }
        save_total_stats(default_stats)
        return default_stats

def save_total_stats(stats):
    stats['last_updated'] = datetime.now().isoformat()
    with open(TOTAL_STATS_FILE, 'w') as f:
        json.dump(stats, f, indent=4)

# Initialize gift cards from JSON
def init_default_categories():
    if not os.path.exists(GIFT_CARDS_FILE) or not GIFT_CARD_CATEGORIES:
        default_categories = [
            {
                'id': 1,
                'name': 'Shopping',
                'cards': []
            },
            {
                'id': 2,
                'name': 'Dining',
                'cards': []
            },
            {
                'id': 3,
                'name': 'Entertainment',
                'cards': []
            }
        ]
        save_gift_cards(default_categories)
        return default_categories
    return GIFT_CARD_CATEGORIES

GIFT_CARD_CATEGORIES = load_gift_cards()
GIFT_CARDS = {}  # Dictionary to store gift card previews
TOTAL_STATS = load_total_stats()  # Initialize total stats

# Admin credentials (in production, use a database)
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# In-memory storage for gift cards (in production, use a database)
SHARED_CARDS = {}

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session:
            flash('Please log in first.')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Admin routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid credentials')
    
    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/admin')
@admin_required
def admin_dashboard():
    try:
        total_cards = sum(len(category.get('cards', [])) for category in GIFT_CARD_CATEGORIES)
        total_categories = len(GIFT_CARD_CATEGORIES)
        
        # Get total value from stats, defaulting to 0 if not found
        total_value = TOTAL_STATS.get('total_generated_value', 0)
        total_transactions = TOTAL_STATS.get('total_transactions', 0)
        
        return render_template('admin/dashboard.html',
                             categories=GIFT_CARD_CATEGORIES,
                             total_cards=total_cards,
                             total_categories=total_categories,
                             total_value=total_value,
                             total_transactions=total_transactions)
    except Exception as e:
        print(f"Error in admin dashboard: {str(e)}")
        flash('Error loading dashboard data', 'error')
        return redirect(url_for('index'))

@app.route('/admin/category/add', methods=['POST'])
@admin_required
def add_category():
    try:
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'error': 'Category name is required'}), 400
        
        # Find the highest existing category ID
        max_id = 0
        for category in GIFT_CARD_CATEGORIES:
            if 'id' in category and category['id'] > max_id:
                max_id = category['id']
            
        new_category = {
            'id': max_id + 1,
            'name': name,
            'cards': []
        }
        
        GIFT_CARD_CATEGORIES.append(new_category)
        save_gift_cards(GIFT_CARD_CATEGORIES)
        return jsonify({'success': True, 'category': new_category})
    except Exception as e:
        print(f"Error adding category: {str(e)}")
        return jsonify({'error': 'Failed to add category'}), 500

@app.route('/admin/category/<int:category_id>/delete', methods=['DELETE'])
@admin_required
def delete_category(category_id):
    try:
        if 0 <= category_id < len(GIFT_CARD_CATEGORIES):
            GIFT_CARD_CATEGORIES.pop(category_id)
            save_gift_cards(GIFT_CARD_CATEGORIES)
            return jsonify({'message': 'Category deleted successfully'})
        return jsonify({'error': 'Category not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/category/<int:category_id>/edit', methods=['PUT'])
@admin_required
def edit_category(category_id):
    try:
        data = request.get_json()
        new_name = data.get('name')
        
        if not new_name:
            return jsonify({'error': 'Category name is required'}), 400
            
        if 0 <= category_id < len(GIFT_CARD_CATEGORIES):
            GIFT_CARD_CATEGORIES[category_id]['name'] = new_name
            save_gift_cards(GIFT_CARD_CATEGORIES)
            return jsonify({'message': 'Category updated successfully'})
            
        return jsonify({'error': 'Category not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/card/add', methods=['POST'])
@admin_required
def admin_add_card():
    try:
        # Get form data
        name = request.form.get('name')
        description = request.form.get('description')
        price = request.form.get('price')
        validity = request.form.get('validity')
        terms = request.form.get('terms')
        category_id = request.form.get('category_id')
        
        if not name or not category_id:
            return jsonify({'error': 'Name and category are required'}), 400
        
        # Find the category
        category_found = False
        try:
            category_id = int(category_id)  # Convert to integer
        except (TypeError, ValueError):
            return jsonify({'error': 'Invalid category ID'}), 400
            
        for category in GIFT_CARD_CATEGORIES:
            if category['id'] == category_id:  # Compare as integers
                # Generate new card ID
                max_id = 0
                for cat in GIFT_CARD_CATEGORIES:
                    for card in cat['cards']:
                        if card['id'] > max_id:
                            max_id = card['id']
                
                new_card = {
                    'id': max_id + 1,
                    'name': name,
                    'description': description,
                    'price': float(price) if price else 0,
                    'validity': int(validity) if validity else 30,
                    'terms': terms,
                    'created_by': 'admin',
                    'created_at': datetime.now().isoformat()
                }
                
                # Handle logo upload
                if 'logo' in request.files:
                    logo = request.files['logo']
                    if logo and allowed_file(logo.filename):
                        filename = secure_filename(f"card_{new_card['id']}_{logo.filename}")
                        logo.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                        new_card['logo'] = filename
                
                category['cards'].append(new_card)
                category_found = True
                save_gift_cards(GIFT_CARD_CATEGORIES)
                break
        
        if not category_found:
            return jsonify({'error': 'Category not found'}), 404
        
        return jsonify({'message': 'Gift card added successfully', 'card': new_card})
    
    except Exception as e:
        print(f"Error adding gift card: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/admin/card/<int:card_id>/delete', methods=['DELETE'])
@admin_required
def delete_card(card_id):
    try:
        for category in GIFT_CARD_CATEGORIES:
            for i, card in enumerate(category['cards']):
                if card['id'] == card_id:
                    # Delete logo file if it exists
                    if card.get('logo'):
                        logo_path = os.path.join(app.config['UPLOAD_FOLDER'], card['logo'])
                        if os.path.exists(logo_path):
                            os.remove(logo_path)
                    
                    category['cards'].pop(i)
                    save_gift_cards(GIFT_CARD_CATEGORIES)
                    return jsonify({'message': 'Gift card deleted successfully'})
        
        return jsonify({'error': 'Gift card not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/card/<int:card_id>/edit', methods=['PUT'])
@admin_required
def edit_card(card_id):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        required_fields = ['name', 'description', 'price', 'validity', 'terms']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Find the card to edit
        card_found = False
        for category in GIFT_CARD_CATEGORIES:
            if 'cards' not in category:
                category['cards'] = []
                
            for card in category['cards']:
                if card.get('id') == card_id:
                    card_found = True
                    # Update all fields with proper type conversion
                    try:
                        card['name'] = str(data['name']).strip()
                        card['description'] = str(data['description']).strip()
                        card['price'] = float(data['price'])
                        card['validity'] = int(data['validity'])
                        card['terms'] = str(data['terms']).strip()
                        
                        # Save changes
                        save_gift_cards(GIFT_CARD_CATEGORIES)
                        return jsonify({
                            'status': 'success',
                            'message': 'Gift card updated successfully'
                        })
                    except ValueError as ve:
                        return jsonify({'error': f'Invalid value provided: {str(ve)}'}), 400
        
        if not card_found:
            return jsonify({'error': 'Gift card not found'}), 404
        
    except Exception as e:
        print(f"Error editing gift card: {str(e)}")
        return jsonify({'error': 'An error occurred while updating the gift card'}), 500

@app.route('/admin/card/<int:card_id>/update_logo', methods=['POST'])
@admin_required
def update_card_logo(card_id):
    try:
        if 'logo' not in request.files:
            return jsonify({'error': 'No logo file provided'}), 400
            
        logo_file = request.files['logo']
        if logo_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if not allowed_file(logo_file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
            
        # Find the card and update its logo
        for category in GIFT_CARD_CATEGORIES:
            for card in category['cards']:
                if card['id'] == card_id:
                    # Delete old logo if it exists
                    if card.get('logo'):
                        logo_path = os.path.join(app.config['UPLOAD_FOLDER'], card['logo'])
                        if os.path.exists(logo_path):
                            os.remove(logo_path)
                    
                    # Save new logo
                    filename = secure_filename(logo_file.filename)
                    logo_file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    card['logo'] = filename
                    save_gift_cards(GIFT_CARD_CATEGORIES)
                    return jsonify({'message': 'Logo updated successfully'})
                    
        return jsonify({'error': 'Gift card not found'}), 404
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user/create_gift_card', methods=['POST'])
def user_create_gift_card():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'card_id', 'value', 
            'recipient_name', 'recipient_email',
            'sender_name', 'sender_email',
            'message', 'design'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'error': f'Missing required field: {field}'
                }), 400

        # Find the selected card template
        card_id = int(data['card_id'])
        selected_card = None
        selected_category = None
        
        for category in GIFT_CARD_CATEGORIES:
            for card in category['cards']:
                if card['id'] == card_id:
                    selected_card = card
                    selected_category = category
                    break
            if selected_card:
                break
        
        if not selected_card:
            return jsonify({
                'status': 'error',
                'error': 'Invalid gift card template selected'
            }), 404

        # Generate unique gift card number
        gift_card_number = str(uuid.uuid4())
        
        # Create personalized gift card
        personalized_card = {
            'id': gift_card_number,
            'template_id': card_id,
            'template_name': selected_card['name'],
            'category': selected_category['name'],
            'value': float(data['value']),
            'recipient': {
                'name': data['recipient_name'],
                'email': data['recipient_email']
            },
            'sender': {
                'name': data['sender_name'],
                'email': data['sender_email']
            },
            'message': data['message'],
            'design': data['design'],
            'created_at': datetime.now().isoformat(),
            'status': 'pending_payment',
            'expiry_date': (datetime.now() + timedelta(days=selected_card['validity'])).isoformat()
        }
        
        # Store the gift card temporarily until payment is completed
        session['pending_gift_card'] = personalized_card
        
        return jsonify({
            'status': 'success',
            'gift_card': personalized_card,
            'next_step': 'payment'
        })
        
    except Exception as e:
        print(f"Error creating gift card: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/')
def index():
    return render_template('index.html', categories=GIFT_CARD_CATEGORIES)

@app.route('/get_card_details', methods=['POST'])
def get_card_details():
    try:
        card_id = request.json.get('card_id')
        if card_id is None:
            return jsonify({'error': 'Card ID is required'}), 400

        # Find the card in our categories
        for category in GIFT_CARD_CATEGORIES:
            for card in category['cards']:
                if card['id'] == card_id:
                    return jsonify({
                        'status': 'success',
                        'card': card
                    })
        
        return jsonify({'error': 'Card not found'}), 404

    except Exception as e:
        print(f"Error in get_card_details: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        print(f"Error serving image {filename}: {str(e)}")
        # Return a default image or 404
        return send_from_directory(app.config['UPLOAD_FOLDER'], 'logo.png')

@app.route('/preview_gift_card', methods=['POST'])
def preview_gift_card():
    try:
        gift_card_data = request.json
        # Generate a unique ID for sharing
        share_id = str(uuid.uuid4())
        
        # Find the card in any category to get its logo and design
        card_id = gift_card_data.get('card_id')
        if card_id:
            for category in GIFT_CARD_CATEGORIES:
                for card in category['cards']:
                    if card['id'] == card_id:
                        gift_card_data['logo'] = card.get('logo')
                        gift_card_data['design'] = card.get('design', 'default')
                        break
        
        # Ensure design field exists
        if 'design' not in gift_card_data:
            gift_card_data['design'] = 'default'
        
        # If we have a category ID, get the category name
        if 'category_id' in gift_card_data:
            category_id = int(gift_card_data['category_id'])
            if 0 <= category_id < len(GIFT_CARD_CATEGORIES):
                gift_card_data['category_name'] = GIFT_CARD_CATEGORIES[category_id]['name']
        
        # Store the gift card data with the share ID
        GIFT_CARDS[share_id] = {
            'data': gift_card_data,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(days=7)  # Link expires in 7 days
        }
        
        return jsonify({
            'status': 'success',
            'preview_data': gift_card_data,
            'share_id': share_id,
            'share_url': url_for('view_shared_card', share_id=share_id, _external=True)
        })
    except Exception as e:
        print(f"Error in preview_gift_card: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/share/<share_id>')
def view_shared_card(share_id):
    if share_id not in GIFT_CARDS:
        flash('Gift card preview not found or has expired.')
        return redirect(url_for('index'))
    
    gift_card = GIFT_CARDS[share_id]
    if gift_card['expires_at'] < datetime.now():
        del GIFT_CARDS[share_id]
        flash('Gift card preview has expired.')
        return redirect(url_for('index'))
    
    return render_template('preview.html', card=gift_card['data'])

@app.route('/categories')
def view_categories():
    return render_template('categories.html', categories=GIFT_CARD_CATEGORIES)

@app.route('/create_gift_card/<int:card_id>')
def create_gift_card(card_id):
    # Find the card in any category
    selected_card = None
    for category in GIFT_CARD_CATEGORIES:
        for card in category['cards']:
            if card['id'] == card_id:
                selected_card = card
                break
        if selected_card:
            break
    
    if not selected_card:
        flash('Invalid gift card selected')
        return redirect(url_for('view_categories'))
    
    return render_template('create_gift_card.html', card=selected_card)

@app.route('/create_gift_card', methods=['POST'])
def create_gift_card_post():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'card_id', 'value', 
            'recipient_name', 'recipient_email',
            'sender_name', 'sender_email',
            'message', 'design'
        ]
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'status': 'error',
                    'error': f'Missing required field: {field}'
                }), 400

        try:
            # Convert card_id to integer for comparison
            card_id = int(data['card_id'])
        except (ValueError, TypeError):
            return jsonify({
                'status': 'error',
                'error': 'Invalid card ID format'
            }), 400

        # Validate card_id exists in categories
        card_exists = False
        selected_card = None
        selected_category = None
        
        # Print debugging information
        print(f"Looking for card_id: {card_id}")
        for category in GIFT_CARD_CATEGORIES:
            print(f"Checking category: {category['name']}")
            for card in category['cards']:
                print(f"  Checking card: {card['id']} - {card['name']}")
                if card['id'] == card_id:
                    card_exists = True
                    selected_card = card
                    selected_category = category
                    break
            if card_exists:
                break
        
        if not card_exists:
            # Return more detailed error message
            return jsonify({
                'status': 'error',
                'error': f'Invalid gift card selected. Card ID {card_id} not found in any category.'
            }), 400

        # Generate unique ID for the gift card
        gift_card_id = str(uuid.uuid4())
        
        # Create gift card data
        gift_card = {
            'id': gift_card_id,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(days=7)).isoformat(),
            'data': {
                'card_id': card_id,
                'card_name': selected_card['name'],
                'card_logo': selected_card['logo'],
                'category_name': selected_category['name'],
                'value': data['value'],
                'recipient': {
                    'name': data['recipient_name'],
                    'email': data['recipient_email']
                },
                'sender': {
                    'name': data['sender_name'],
                    'email': data['sender_email']
                },
                'message': data['message'],
                'design': data['design']
            }
        }
        
        # Store gift card
        SHARED_CARDS[gift_card_id] = gift_card
        
        return jsonify({
            'status': 'success',
            'message': 'Gift card created successfully',
            'gift_card': gift_card,
            'redirect_url': url_for('view_categories')
        })
        
    except Exception as e:
        print(f"Error creating gift card: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')
        
        # Here you would typically send an email or store the contact form submission
        # For now, we'll just show a success message
        flash('Thank you for your message! We will get back to you soon.', 'success')
        return redirect(url_for('contact'))
        
    return render_template('contact.html')

@app.route('/process_payment', methods=['POST'])
def process_payment():
    try:
        data = request.get_json()
        card_id = data.get('card_id')
        if not card_id:
            return jsonify({'error': 'Card ID is required'}), 400

        # Find the card in the preview
        card_data = GIFT_CARDS.get(card_id)
        if not card_data:
            return jsonify({'error': 'Invalid card ID'}), 400

        # Simulate payment processing
        time.sleep(2)  # Simulate processing time

        # Update total statistics
        try:
            card_value = float(card_data.get('value', 0))
            TOTAL_STATS['total_generated_value'] += card_value
            TOTAL_STATS['total_transactions'] += 1
            save_total_stats(TOTAL_STATS)
        except (ValueError, TypeError) as e:
            print(f"Error updating statistics: {e}")

        # Store the card data in the appropriate category
        for category in GIFT_CARD_CATEGORIES:
            if str(category.get('id')) == str(card_data.get('category_id')):
                if 'cards' not in category:
                    category['cards'] = []
                card_data['status'] = 'active'
                card_data['created_at'] = datetime.now().isoformat()
                category['cards'].append(card_data)
                save_gift_cards(GIFT_CARD_CATEGORIES)
                break

        # Remove from preview storage
        if card_id in GIFT_CARDS:
            del GIFT_CARDS[card_id]

        return jsonify({
            'status': 'success',
            'message': 'Payment processed successfully'
        })

    except Exception as e:
        print(f"Error processing payment: {e}")
        return jsonify({
            'status': 'error',
            'error': 'An error occurred while processing the payment'
        }), 500

@app.route('/payment_success')
def payment_success():
    return render_template('payment_success.html')

# Add datetime to all templates
@app.context_processor
def inject_now():
    return {'now': datetime.utcnow}

# Initialize default gift card logos
def init_default_images():
    default_logos = {
        'amazon.png': 'https://logo.clearbit.com/amazon.com',
        'target.png': 'https://logo.clearbit.com/target.com',
        'walmart.png': 'https://logo.clearbit.com/walmart.com',
        'netflix.png': 'https://logo.clearbit.com/netflix.com',
        'spotify.png': 'https://logo.clearbit.com/spotify.com',
        'playstation.png': 'https://logo.clearbit.com/playstation.com',
        'starbucks.png': 'https://logo.clearbit.com/starbucks.com',
        'ubereats.png': 'https://logo.clearbit.com/ubereats.com',
        'doordash.png': 'https://logo.clearbit.com/doordash.com'
    }
    
    import requests
    import os
    
    for logo_name, logo_url in default_logos.items():
        logo_path = os.path.join(app.config['UPLOAD_FOLDER'], logo_name)
        if not os.path.exists(logo_path):
            try:
                response = requests.get(logo_url)
                if response.status_code == 200:
                    with open(logo_path, 'wb') as f:
                        f.write(response.content)
                    print(f"Downloaded {logo_name}")
                else:
                    print(f"Failed to download {logo_name}: Status {response.status_code}")
            except Exception as e:
                print(f"Error downloading {logo_name}: {str(e)}")

if __name__ == '__main__':
    # Initialize default images and categories
    init_default_images()
    init_default_categories()
    
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
