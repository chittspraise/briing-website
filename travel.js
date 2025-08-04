const SUPABASE_URL = 'https://rjntkaamdisyykpgjezm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbnRrYWFtZGlzeXlrcGdqZXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMjU3MjMsImV4cCI6MjA2NjcwMTcyM30.SnkV3sMLF_Mw38JZieZxocY-aAkCAO0-MLzmo_ZkpZk';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const travelForm = document.getElementById('travel-form');
    if (travelForm) {
        travelForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const { data: { user } } = await supabaseClient.auth.getUser();

            if (!user) {
                alert('You must be logged in to add a trip.');
                window.location.href = 'login.html';
                return;
            }

            const travelData = {
                user_id: user.id,
                traveler_name: document.getElementById('traveler-name').value,
                from_country: document.getElementById('from-country').value,
                to_country: document.getElementById('to-country').value,
                departure_date: document.getElementById('departure-date').value,
                return_date: document.getElementById('return-date').value || null,
                budget: parseFloat(document.getElementById('budget').value) || 0,
                is_available: true,
                notes: `Budget: R${document.getElementById('budget').value || 0}`,
            };

            const { error } = await supabaseClient.from('travel').insert([travelData]);

            if (error) {
                alert('Error adding trip: ' + error.message);
            } else {
                alert('Trip added successfully!');
                window.location.href = 'index.html';
            }
        });
    }
});
