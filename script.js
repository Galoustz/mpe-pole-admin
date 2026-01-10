let selectedAmount = null;

// Initialize amount buttons
document.addEventListener('DOMContentLoaded', () => {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const contributeBtn = document.getElementById('contribute-btn');
    const contributionSection = document.getElementById('contribution-section');
    const thankYouSection = document.getElementById('thank-you-section');

    // Amount button selection
    amountButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove selected class from all buttons
            amountButtons.forEach(b => b.classList.remove('selected'));
            // Add selected class to clicked button
            btn.classList.add('selected');
            selectedAmount = parseInt(btn.dataset.amount);
            contributeBtn.disabled = false;
        });
    });

    // Contribute button handler
    contributeBtn.addEventListener('click', async () => {
        if (!selectedAmount) return;

        // Prompt for phone number
        const phone = prompt('Ingiza nambari yako ya simu:');
        if (!phone) return;

        // Validate phone number (basic validation)
        const phoneRegex = /^(\+255|0)?[0-9]{9}$/;
        const cleanPhone = phone.replace(/\s+/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            alert('Tafadhali ingiza nambari ya simu sahihi.');
            return;
        }

        // Disable button during processing
        contributeBtn.disabled = true;
        contributeBtn.textContent = 'Inasubiri...';

        try {
            const response = await fetch('/api/**/*.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: selectedAmount,
                    phone: cleanPhone,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Show thank you message
                contributionSection.style.display = 'none';
                thankYouSection.classList.remove('hidden');
                
                // Scroll to thank you message
                thankYouSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert(data.message || 'Kuna tatizo. Tafadhali jaribu tena.');
                contributeBtn.disabled = false;
                contributeBtn.textContent = 'Changia Sasa';
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Kuna tatizo la mtandao. Tafadhali jaribu tena.');
            contributeBtn.disabled = false;
            contributeBtn.textContent = 'Changia Sasa';
        }
    });

    // Share buttons
    setupShareButtons();
});

function setupShareButtons() {
    const currentUrl = window.location.href;
    const shareText = 'Mchango wa pole - Tuko pamoja katika kipindi hiki kigumu';

    // WhatsApp share
    document.getElementById('whatsapp-share').addEventListener('click', () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
        window.open(url, '_blank');
    });

    // Telegram share
    document.getElementById('telegram-share').addEventListener('click', () => {
        const url = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank');
    });

    // Facebook share
    document.getElementById('facebook-share').addEventListener('click', () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
        window.open(url, '_blank');
    });

    // Copy link
    document.getElementById('copy-link').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            const btn = document.getElementById('copy-link');
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = currentUrl;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                const btn = document.getElementById('copy-link');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            } catch (err) {
                alert('Not Copied. Please Copy!.');
            }
            document.body.removeChild(textArea);
        }
    });
}
