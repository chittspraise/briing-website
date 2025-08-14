const SUPABASE_URL = 'https://rjntkaamdisyykpgjezm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbnRrYWFtZGlzeXlrcGdqZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjU3MjMsImV4cCI6MjA2NjcwMTcyM30.SnkV3sMLF_Mw38JZieZxocY-aAkCAO0-MLzmo_ZkpZk';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                alert('Error logging in: ' + error.message);
            } else {
                showNotification('Logged in successfully!');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const first_name = document.getElementById('first_name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const { data, error } = await supabaseClient.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        first_name: first_name,
                        image_url: `https://i.pravatar.cc/150?u=${email}`
                    }
                }
            });
            if (error) {
                alert('Error signing up: ' + error.message);
            } else {
                const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (signInError) {
                    alert('Error logging in after sign up: ' + signInError.message);
                } else {
                    showNotification('Signed up and logged in successfully!');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                }
            }
        });
    }
});

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

async function fetchOrders() {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;

    const { data, error } = await supabaseClient
        .from('product_orders')
        .select('*, profiles(first_name, image_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    let ordersHtml = '';
    for (const order of data) {
        const imageUrl = order.image_url.startsWith('http') ? order.image_url : new URL(order.image_url, window.location.origin).href;
        ordersHtml += `
            <div class="data-card product-card">
                <div class="card-image-container">
                    <img src="${order.image_url}" alt="${order.item_name}" class="data-image">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${order.item_name}</h3>
                    <div class="card-info-row">
                        <span>Deliver to:</span>
                        <span class="card-info-value">${order.destination}</span>
                    </div>
                    <div class="card-info-row">
                        <span>From:</span>
                        <span class="card-info-value">${order.source_country}</span>
                    </div>
                    <div class="card-info-row price">
                        <span>Reward:</span>
                        <span class="card-info-value amount-value">ZAR ${order.traveler_reward}</span>
                    </div>
                </div>
                <div class="card-footer">
                     <div class="card-header">
                        <img src="${order.profiles.image_url || 'https://i.pravatar.cc/100'}" alt="User Avatar" class="avatar-small">
                        <p class="username-small">${order.profiles.first_name || 'User'}</p>
                    </div>
                    <a href="product-link.html?name=${encodeURIComponent(order.item_name)}&store=${encodeURIComponent(order.store)}&price=${order.price}&image=${encodeURIComponent(imageUrl)}" class="btn btn-accept">Order this item</a>
                </div>
            </div>
        `;
    }
    ordersContainer.innerHTML = ordersHtml;
}

async function fetchTravelers() {
    const travelersContainer = document.getElementById('travelers-container');
    if (!travelersContainer) return;

    const { data, error } = await supabaseClient
        .from('travel')
        .select('*, profiles(first_name, image_url)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching travelers:', error);
        travelersContainer.innerHTML = '<p>Could not load traveler data.</p>';
        return;
    }

    if (!data || data.length === 0) {
        travelersContainer.innerHTML = '<p>No upcoming travelers at the moment.</p>';
        return;
    }

    let travelersHtml = '';
    for (const travel of data) {
        travelersHtml += `
            <div class="data-card traveler-card">
                <div class="card-header">
                    <img src="${(travel.profiles && travel.profiles.image_url) || 'https://i.pravatar.cc/100'}" alt="User Avatar" class="avatar-small">
                    <div>
                        <p class="username-small">${(travel.profiles && travel.profiles.first_name) || 'User'}</p>
                        <p class="date">${new Date(travel.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="card-content">
                    <h3>Traveling to ${travel.to_country}</h3>
                    <div class="travel-route">
                        <div class="route-pin"></div>
                        <div class="route-path"></div>
                        <div class="route-pin"></div>
                    </div>
                    <div class="card-info-row travel-details">
                        <span>${travel.from_country}</span>
                        <span>${travel.to_country}</span>
                    </div>
                    <div class="card-info-row">
                        <span>Arrival:</span>
                        <span class="card-info-value">${new Date(travel.departure_date).toLocaleDateString()}</span>
                    </div>
                    <div class="card-info-row">
                        <span>Budget:</span>
                        <span class="card-info-value amount-value">ZAR ${travel.budget}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="https://play.google.com/store" target="_blank" class="btn btn-request">Request Delivery</a>
                </div>
            </div>
        `;
    }
    travelersContainer.innerHTML = travelersHtml;
}

async function fetchHotDeals() {
    const receivedContainer = document.getElementById('received-orders-container');
    const pendingContainer = document.getElementById('pending-orders-container');
    if (!receivedContainer || !pendingContainer) return;

    // Fetch 3 received orders
    const { data: receivedData, error: receivedError } = await supabaseClient
        .from('product_orders')
        .select('item_name, store, price, image_url')
        .eq('status', 'received')
        .limit(3);

    if (receivedError) console.error('Error fetching received orders:', receivedError);
    else receivedContainer.innerHTML = generateHotDealsHtml(receivedData);

    // Fetch 3 pending orders
    const { data: pendingData, error: pendingError } = await supabaseClient
        .from('product_orders')
        .select('item_name, store, price, image_url')
        .eq('status', 'pending')
        .limit(3);

    if (pendingError) console.error('Error fetching pending orders:', pendingError);
    else pendingContainer.innerHTML = generateHotDealsHtml(pendingData);
}

function generateHotDealsHtml(data) {
    if (!data || data.length === 0) {
        return '<p>No items to display in this category right now.</p>';
    }
    let html = '';
    for (const item of data) {
        const imageUrl = item.image_url.startsWith('http') ? item.image_url : new URL(item.image_url, window.location.origin).href;
        const orderLink = `product-link.html?name=${encodeURIComponent(item.item_name)}&store=${encodeURIComponent(item.store)}&price=${item.price}&image=${encodeURIComponent(imageUrl)}`;
        html += `
            <div class="data-card product-card">
                <div class="card-image-container">
                    <img src="${item.image_url || 'https://i.imgur.com/aj3x32s.png'}" alt="${item.item_name}" class="data-image">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.item_name}</h3>
                    <div class="card-info-row">
                        <span>Store:</span>
                        <span class="card-info-value">${item.store || 'N/A'}</span>
                    </div>
                    <div class="card-info-row price">
                        <span>Price:</span>
                        <span class="card-info-value amount-value">ZAR ${item.price}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="${orderLink}" class="btn btn-accept">Order this item</a>
                </div>
            </div>
        `;
    }
    return html;
}

function setupScrollButtons() {
    const scrollArrows = document.querySelectorAll('.scroll-arrow');
    scrollArrows.forEach(arrow => {
        arrow.addEventListener('click', () => {
            const targetId = arrow.dataset.target;
            const container = document.getElementById(targetId);
            const scrollAmount = 320; // Width of a card + gap

            if (arrow.classList.contains('next-arrow')) {
                container.scrollLeft += scrollAmount;
            } else {
                container.scrollLeft -= scrollAmount;
            }
        });
    });
}