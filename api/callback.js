export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Get callback data from Fast Lipa
        const callbackData = req.body;

        // Verify payment status
        // Fast Lipa typically sends: status, transaction_id, reference, etc.
        if (callbackData.status === 'success' || callbackData.status === 'completed') {
            // Payment successful
            // You can log this, update database, send notifications, etc.
            console.log('Payment successful:', {
                transactionId: callbackData.transaction_id || callbackData.id,
                reference: callbackData.reference,
                amount: callbackData.amount,
            });

            // Return 200 OK to acknowledge receipt
            return res.status(200).json({ 
                success: true, 
                message: 'Callback received' 
            });
        } else if (callbackData.status === 'failed' || callbackData.status === 'cancelled') {
            // Payment failed
            console.log('Payment failed:', {
                transactionId: callbackData.transaction_id || callbackData.id,
                reference: callbackData.reference,
                reason: callbackData.reason || 'Unknown',
            });

            // Still return 200 OK to acknowledge receipt
            return res.status(200).json({ 
                success: false, 
                message: 'Payment failed' 
            });
        } else {
            // Unknown status
            console.log('Unknown payment status:', callbackData);
            return res.status(200).json({ 
                success: false, 
                message: 'Unknown status' 
            });
        }

    } catch (error) {
        console.error('Error processing callback:', error);
        // Still return 200 OK to prevent Fast Lipa from retrying
        return res.status(200).json({ 
            success: false, 
            message: 'Callback processing error' 
        });
    }
}
