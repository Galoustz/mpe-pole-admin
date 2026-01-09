export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { amount, phone } = req.body;

        // Validate amount
        const validAmounts = [200, 500, 1000, 2000, 5000, 10000, 20000,50000];
        if (!amount || !validAmounts.includes(parseInt(amount))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Kiasi si sahihi' 
            });
        }

        // Validate and sanitize phone number
        if (!phone || typeof phone !== 'string') {
            return res.status(400).json({ 
                success: false, 
                message: 'Nambari ya simu si sahihi' 
            });
        }

        // Sanitize phone number (remove spaces, ensure proper format)
        const cleanPhone = phone.replace(/\s+/g, '').trim();
        const phoneRegex = /^(\+255|0)?[0-9]{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nambari ya simu si sahihi' 
            });
        }

        // Format phone number for Fast Lipa (ensure it starts with country code)
        let formattedPhone = cleanPhone;
        if (cleanPhone.startsWith('0')) {
            formattedPhone = '255' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('255')) {
            formattedPhone = '255' + cleanPhone;
        }

        // Get environment variables
        const apiKey = process.env.FASTLIPA_API_KEY;
        const baseUrl = process.env.FASTLIPA_BASE_URL;

        if (!apiKey || !baseUrl) {
            console.error('Missing Fast Lipa configuration');
            return res.status(500).json({ 
                success: false, 
                message: 'Tatizo la usanidi. Tafadhali wasiliana na msimamizi.' 
            });
        }

        // Get current domain for callback URL
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const callbackUrl = `${protocol}://${host}/api/callback`;

        // Prepare Fast Lipa request
        const fastLipaPayload = {
            amount: parseInt(amount),
            phone: formattedPhone,
            reference: 'MPE_POLE_ADMIN',
            description: 'Mchango wa pole',
            callback_url: callbackUrl,
        };

        // Call Fast Lipa API
        const fastLipaResponse = await fetch(`${baseUrl}/api/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(fastLipaPayload),
        });

        const fastLipaData = await fastLipaResponse.json();

        if (!fastLipaResponse.ok) {
            console.error('Fast Lipa API error:', fastLipaData);
            return res.status(500).json({ 
                success: false, 
                message: 'Kuna tatizo na malipo. Tafadhali jaribu tena.' 
            });
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Malipo yamepokelewa',
            transactionId: fastLipaData.transaction_id || fastLipaData.id,
        });

    } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Kuna tatizo. Tafadhali jaribu tena baadaye.' 
        });
    }
}
