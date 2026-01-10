export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const data = req.body;

        if (!data || !data.status) {
            console.error('Invalid callback data:', data);
            return res.status(200).json({ success: false });
        }

        // 🔐 OPTIONAL: Verify callback authenticity
        // if (data.secret !== process.env.FASTLIPA_SECRET) {
        //     console.error('Invalid callback secret');
        //     return res.status(200).json({ success: false });
        // }

        const transactionId = data.transaction_id || data.id;

        // 🛑 CHECK DUPLICATE TRANSACTION
        // const exists = await db.findTransaction(transactionId);
        // if (exists) return res.status(200).json({ success: true });

        if (data.status === 'success' || data.status === 'completed') {
            console.log('✅ Payment successful:', {
                transactionId,
                reference: data.reference,
                amount: data.amount,
            });

            // await db.saveTransaction(...)
            // await db.updateOrderStatus(...)

            return res.status(200).json({ success: true });
        }

        if (data.status === 'failed' || data.status === 'cancelled') {
            console.log('❌ Payment failed:', {
                transactionId,
                reference: data.reference,
                reason: data.reason,
            });

            return res.status(200).json({ success: false });
        }

        console.log('⚠️ Unknown status:', data);
        return res.status(200).json({ success: false });

    } catch (error) {
        console.error('Callback error:', error);
        return res.status(200).json({ success: false });
    }
}
