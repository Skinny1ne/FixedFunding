import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Lock, CreditCard, CheckCircle, Download, Printer } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import { useAuth } from '@/hooks/useAuth';
import { generatePDFFromHTML, getProfessionalPDFHTML } from '@/utils/pdfGenerator';

interface PaymentPageProps {
  bookingDetails: {
    roomName: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    roomRate: number;
    nights: number;
    subtotal: number;
    tax: number;
    total: number;
    depositAmount: number;
    balanceDue: number;
  };
  onPaymentComplete: (confirmationNumber: string, depositPaid: number) => void;
  onCancel: () => void;
}

// Ensure you set VITE_PAYSTACK_PUBLIC_KEY in your .env file
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder_key_please_replace';

export function PaymentPage({ bookingDetails, onPaymentComplete, onCancel }: PaymentPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'disclaimer' | 'confirmation'>('disclaimer');
  const [confirmationNumber, setConfirmationNumber] = useState('');

  // Paystack expects amount in smallest currency unit (e.g., kobo/cents). For ZAR, multiply by 100.
  const config = {
    reference: `BK-${new Date().getTime().toString()}`,
    email: user?.email || 'guest@azurehorizon.com',
    amount: Math.round(bookingDetails.depositAmount * 100),
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'ZAR',
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaystackSuccess = (reference: any) => {
    // This is called when the payment is successfully completed in the Paystack modal
    setConfirmationNumber(reference.reference || `BK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
    setStep('confirmation');
  };

  const handlePaystackClose = () => {
    // This is called when the user closes the Paystack modal without completing payment
    console.log('Payment modal closed');
  };

  const triggerPayment = () => {
    if (PAYSTACK_PUBLIC_KEY.includes('placeholder')) {
      alert("Please configure your VITE_PAYSTACK_PUBLIC_KEY in the .env file to test actual payments.");
    }
    initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose });
  };

  const downloadReceipt = async () => {
    const invoiceNumber = `INV-${confirmationNumber.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    
    const details = [
      { label: 'Invoice Number', value: invoiceNumber },
      { label: 'Confirmation', value: confirmationNumber },
      { label: 'Date Issued', value: new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }) },
      { label: 'Payment Method', value: 'Paystack (Online)' },
      { label: 'Room', value: bookingDetails.roomName },
      { label: 'Check-in', value: `${bookingDetails.checkIn} (from 15:00)` },
      { label: 'Check-out', value: `${bookingDetails.checkOut} (by 11:00)` },
      { label: 'Guests', value: bookingDetails.guests.toString() },
    ];

    const items = [
      { name: `${bookingDetails.roomName} (${bookingDetails.nights} nights @ R ${bookingDetails.roomRate}/night)`, quantity: bookingDetails.nights, price: bookingDetails.roomRate, subtotal: bookingDetails.subtotal },
      { name: 'Taxes & Fees (15% VAT)', quantity: 1, price: bookingDetails.tax, subtotal: bookingDetails.tax },
    ];

    const html = getProfessionalPDFHTML({
      title: 'DEPOSIT PAYMENT RECEIPT',
      guestName: 'Guest',
      details: details,
      items: items,
      subtotal: bookingDetails.subtotal,
      tax: bookingDetails.tax,
      total: bookingDetails.depositAmount,
      footer: `Deposit of R ${bookingDetails.depositAmount} paid successfully. Remaining balance of R ${bookingDetails.balanceDue} is due upon check-in at 15:00.\n\nAzure Horizon Resort • reservations@azurehorizon.com • +27 (0)21 555 0100`
    });
    
    await generatePDFFromHTML(html, `Deposit_Receipt_${confirmationNumber}.pdf`);
  };

  const handleComplete = () => {
    onPaymentComplete(confirmationNumber, bookingDetails.depositAmount);
  };

  if (step === 'disclaimer') {
    return (
      <div className="w-full animate-in fade-in zoom-in-95 duration-300">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <AlertCircle className="h-6 w-6" />
              Deposit & Cancellation Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-2">Important Information</p>
              <ul className="text-sm text-amber-700 space-y-2 list-disc list-inside">
                <li>A non-refundable deposit of <strong>15%</strong> is required to confirm your booking.</li>
                <li>The remaining <strong>85%</strong> is due upon check-in.</li>
                <li>Standard Check-in time is <strong>15:00 (3:00 PM)</strong>.</li>
                <li>Standard Check-out time is <strong>11:00 AM</strong>.</li>
                <li>Cancellations made more than 48 hours before check-in receive a 50% deposit refund.</li>
                <li>Cancellations within 48 hours of check-in forfeit the full deposit.</li>
                <li>No-shows will be charged the full reservation amount.</li>
                <li>Early check-out may incur additional fees. Extended stays can be requested at the Front Desk.</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Room Total:</span>
                <span className="font-semibold">R {bookingDetails.total}</span>
              </div>
              <div className="flex justify-between mb-2 text-amber-600">
                <span>Deposit Due Now:</span>
                <span className="font-bold">R {bookingDetails.depositAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance at Check-in:</span>
                <span>R {bookingDetails.balanceDue}</span>
              </div>
            </div>

            <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 p-4 rounded-lg flex items-start gap-3">
               <Lock className="h-5 w-5 text-[#1e3a5f] shrink-0 mt-0.5" />
               <div>
                  <p className="text-sm font-semibold text-[#1e3a5f]">Secure Checkout</p>
                  <p className="text-xs text-gray-500 mt-1">You will be redirected to our secure payment gateway to complete your transaction. No card details are stored on our servers.</p>
               </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel Booking
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={triggerPayment}>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay R {bookingDetails.depositAmount} Securely
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'confirmation') {
    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-none shadow-2xl overflow-hidden">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-serif text-[#1e3a5f]">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-800">Your deposit of <strong>R {bookingDetails.depositAmount}</strong> has been received.</p>
              <p className="text-xs text-green-600 mt-1">Confirmation: {confirmationNumber}</p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <p className="text-xs font-bold uppercase">Booking Summary</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Room:</span>
                  <span className="font-semibold">{bookingDetails.roomName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Stay:</span>
                  <div className="text-right">
                    <div>{bookingDetails.checkIn} <span className="text-gray-500 text-xs">(Check-in: 15:00)</span></div>
                    <div>{bookingDetails.checkOut} <span className="text-gray-500 text-xs">(Check-out: 11:00)</span></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Guests:</span>
                  <span>{bookingDetails.guests}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Room Cost:</span>
                    <span>R {bookingDetails.total}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Deposit Paid:</span>
                    <span>- R {bookingDetails.depositAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>Balance Due at Check-in:</span>
                    <span>R {bookingDetails.balanceDue}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={downloadReceipt}>
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button className="flex-1 bg-[#1e3a5f]" onClick={handleComplete}>
                Complete Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}