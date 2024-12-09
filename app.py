from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask_cors import CORS
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Gift card categories
GIFT_CARD_CATEGORIES = [
    {
        'name': 'Shopping',
        'cards': [
            {'id': 1, 'name': 'Amazon', 'logo': 'amazon.png'},
            {'id': 2, 'name': 'Target', 'logo': 'target.png'},
            {'id': 3, 'name': 'Walmart', 'logo': 'walmart.png'}
        ]
    },
    {
        'name': 'Entertainment',
        'cards': [
            {'id': 4, 'name': 'Netflix', 'logo': 'netflix.png'},
            {'id': 5, 'name': 'Spotify', 'logo': 'spotify.png'},
            {'id': 6, 'name': 'PlayStation', 'logo': 'playstation.png'}
        ]
    },
    {
        'name': 'Food & Dining',
        'cards': [
            {'id': 7, 'name': 'Starbucks', 'logo': 'starbucks.png'},
            {'id': 8, 'name': 'Uber Eats', 'logo': 'ubereats.png'},
            {'id': 9, 'name': 'DoorDash', 'logo': 'doordash.png'}
        ]
    }
]

# In-memory storage for gift cards (in production, use a database)
GIFT_CARDS = {}
SHARED_CARDS = {}

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

@app.route('/preview_gift_card', methods=['POST'])
def preview_gift_card():
    gift_card_data = request.json
    # Generate a unique ID for sharing
    share_id = str(uuid.uuid4())
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

@app.route('/share/<share_id>')
def view_shared_card(share_id):
    if share_id not in GIFT_CARDS:
        return render_template('error.html', message='Gift card not found or has expired')
    
    gift_card = GIFT_CARDS[share_id]
    if datetime.now() > gift_card['expires_at']:
        del GIFT_CARDS[share_id]
        return render_template('error.html', message='Gift card link has expired')
    
    return render_template('shared_card.html', gift_card=gift_card['data'])

@app.route('/create_gift_card', methods=['POST'])
def create_gift_card():
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

        # Generate unique ID for the gift card
        card_id = str(uuid.uuid4())
        
        # Create gift card data
        gift_card = {
            'id': card_id,
            'created_at': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(days=7)).isoformat(),
            'data': {
                'card_id': data['card_id'],
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
        
        # Store gift card (in memory for now)
        SHARED_CARDS[card_id] = gift_card
        
        # Generate share URL
        share_url = f"/gift-card/{card_id}"
        
        return jsonify({
            'status': 'success',
            'card_id': card_id,
            'share_url': share_url
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5007)
