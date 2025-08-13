const page = window.location.pathname.split('/').pop();

// Page: product-link.html
if (page === 'product-link.html') {
    const params = new URLSearchParams(window.location.search);
    const form = document.getElementById('product-details-form');
    
    if (form) {
        document.getElementById('product-name').value = params.get('name') || '';
        document.getElementById('product-price').value = params.get('price') || '';
        
        const imageUrl = params.get('image');
        if (imageUrl) {
            document.getElementById('main-image').src = imageUrl;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const orderDetails = {
                name: document.getElementById('product-name').value,
                url: document.getElementById('product-url').value,
                price: document.getElementById('product-price').value,
                quantity: document.getElementById('product-quantity').value,
                description: document.getElementById('product-description').value,
                image: document.getElementById('main-image').src,
                store: params.get('store') || 'Custom'
            };

            for (const [key, value] of Object.entries(orderDetails)) {
                localStorage.setItem(`order_${key}`, value);
            }
            
            window.location.href = 'delivery-details.html';
        });
    }
}

// Page: delivery-details.html
if (page === 'delivery-details.html') {
    const form = document.getElementById('delivery-details-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            localStorage.setItem('order_deliver_from', document.getElementById('deliver-from').value);
            localStorage.setItem('order_deliver_to', document.getElementById('deliver-to').value);
            localStorage.setItem('order_wait_time', document.getElementById('wait-time').value);
            window.location.href = 'product-summary.html';
        });
    }
}

// Page: product-summary.html
if (page === 'product-summary.html') {
    const supabaseClient = supabase.createClient('https://rjntkaamdisyykpgjezm.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbnRrYWFtZGlzeXlrcGdqZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjU3MjMsImV4cCI6MjA2NjcwMTcyM30.SnkV3sMLF_Mw38JZieZxocY-aAkCAO0-MLzmo_ZkpZk');

    const order = {
        name: localStorage.getItem('order_name') || 'N/A',
        image: localStorage.getItem('order_image') || 'https://i.imgur.com/aj3x32s.png',
        deliver_from: localStorage.getItem('order_deliver_from') || 'N/A',
        deliver_to: localStorage.getItem('order_deliver_to') || 'N/A',
        wait_time: localStorage.getItem('order_wait_time') || 'N/A',
        quantity: parseInt(localStorage.getItem('order_quantity') || '1'),
        store: localStorage.getItem('order_store') || 'Custom',
        description: localStorage.getItem('order_description') || 'No details provided.',
        price: parseFloat(localStorage.getItem('order_price') || '0'),
        url: localStorage.getItem('order_url') || ''
    };

    // Populate static fields
    document.getElementById('summary-image').src = order.image;
    document.getElementById('summary-product-name').textContent = order.name;
    document.getElementById('summary-deliver-from').textContent = order.deliver_from;
    document.getElementById('summary-deliver-to').textContent = order.deliver_to;
    document.getElementById('summary-wait-time').textContent = order.wait_time;
    document.getElementById('summary-packaging').textContent = 'With box';
    document.getElementById('summary-store').textContent = order.store;
    document.getElementById('summary-description').textContent = order.description;

    const quantityEl = document.getElementById('summary-quantity');
    const rewardInput = document.getElementById('traveler-reward');
    const costBreakdownContainer = document.getElementById('cost-breakdown');
    let currentQuantity = order.quantity;
    let finalCosts = {};

    const calculateCosts = () => {
        const reward = parseFloat(rewardInput.value) || 0;
        const productTotal = order.price * currentQuantity;
        const platformFee = productTotal * 0.05;
        const processingFee = productTotal * 0.05;
        const vat = productTotal * 0.15;
        const total = productTotal + platformFee + processingFee + vat + reward;

        finalCosts = {
            productTotal, platformFee, processingFee, vat, reward, total
        };

        costBreakdownContainer.innerHTML = `
            <div class="summary-detail-row">
                <span>Product price (x${currentQuantity})</span><span class="summary-value">ZAR ${productTotal.toFixed(2)}</span>
            </div>
            <div class="summary-detail-row">
                <span>VAT (estimated)</span><span class="summary-value">ZAR ${vat.toFixed(2)}</span>
            </div>
            <div class="summary-detail-row">
                <span>Platform fee</span><span class="summary-value">ZAR ${platformFee.toFixed(2)}</span>
            </div>
            <div class="summary-detail-row">
                <span>Processing fee</span><span class="summary-value">ZAR ${processingFee.toFixed(2)}</span>
            </div>
            <div class="summary-detail-row">
                <span>Traveler reward</span><span class="summary-value">ZAR ${reward.toFixed(2)}</span>
            </div>
            <div class="summary-detail-row" style="font-weight: bold;">
                <span>Estimated total</span><span class="summary-value">ZAR ${total.toFixed(2)}</span>
            </div>
        `;
    };

    const updateQuantity = (newQuantity) => {
        currentQuantity = Math.max(1, newQuantity);
        quantityEl.textContent = currentQuantity;
        calculateCosts();
    };

    document.getElementById('quantity-minus').addEventListener('click', () => updateQuantity(currentQuantity - 1));
    document.getElementById('quantity-plus').addEventListener('click', () => updateQuantity(currentQuantity + 1));
    rewardInput.addEventListener('input', calculateCosts);
    
    updateQuantity(currentQuantity); // Initial calculation

    document.getElementById('submit-order').addEventListener('click', async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert('You must be logged in to submit an order.');
            window.location.href = 'login.html';
            return;
        }

        const orderData = {
            user_id: user.id,
            item_name: order.name,
            store: order.store,
            price: finalCosts.productTotal,
            quantity: currentQuantity,
            details: order.description,
            with_box: true,
            image_url: order.image,
            source_country: order.deliver_from,
            destination: order.deliver_to,
            wait_time: order.wait_time,
            platform_fee: finalCosts.platformFee,
            processing_fee: finalCosts.processingFee,
            vat_estimate: finalCosts.vat,
            traveler_reward: finalCosts.reward,
            estimated_total: finalCosts.total,
            status: 'pending',
        };

        const { error } = await supabaseClient.from('product_orders').insert([orderData]);

        if (error) {
            alert('Error submitting order: ' + error.message);
        } else {
            alert('Order submitted successfully!');
            // Clear local storage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('order_')) {
                    localStorage.removeItem(key);
                }
            });
            window.location.href = 'index.html';
        }
    });
}