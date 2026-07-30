import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, ToastContext } from '../App';
import Modal from '../components/Modal';

export default function Fees() {
  const { request } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  const [fees, setFees] = useState([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Installment collector form fields
  const [feeId, setFeeId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [balance, setBalance] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [receiptNo, setReceiptNo] = useState('');

  // Receipt modal state
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const res = await request('/fees');
      if (res.success) setFees(res.fees);
    } catch (e) {
      console.error(e);
    }
  };

  const openPayModal = (id, sName, remaining) => {
    setFeeId(id);
    setStudentName(sName);
    setBalance(remaining);
    setAmountPaid(remaining); // Default to full pay
    setPaymentMethod('UPI');
    setReceiptNo('');
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (amountPaid > balance) {
      showToast(`Payment exceeds outstanding balance of ₹${balance}`, 'error');
      return;
    }

    const payload = {
      amountPaid: Number(amountPaid),
      paymentMethod
    };
    if (receiptNo) payload.receiptNo = receiptNo;

    try {
      const res = await request(`/fees/${feeId}/pay`, 'POST', payload);
      if (res.success) {
        showToast('Payment recorded successfully!');
        setIsPayModalOpen(false);
        fetchFees();
        // Load and show receipt printed
        openReceiptViewer(feeId, res.receipt._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openReceiptViewer = async (fId, pId) => {
    try {
      const res = await request(`/fees/receipt/${fId}/${pId}`);
      if (res.success) {
        setReceiptData(res.receipt);
        setIsReceiptModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="glass-card">
        <div className="card-header mb-4">
          <h3>Student Fee Accounts</h3>
        </div>

        {/* Data Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Total Fees</th>
                <th>Amount Paid</th>
                <th>Pending Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.length > 0 ? (
                fees.map(f => {
                  const pendingVal = f.amountTotal - f.amountPaid;
                  let statusBadge = '';
                  if (f.status === 'Paid') statusBadge = '<span class="badge badge-success">Paid</span>';
                  else if (f.status === 'Partially Paid') statusBadge = '<span class="badge badge-warning">Partial</span>';
                  else statusBadge = '<span class="badge badge-danger">Pending</span>';

                  return (
                    <tr key={f._id}>
                      <td><strong className="text-indigo">{f.studentId?.admissionNumber || 'ADM-XXX'}</strong></td>
                      <td><strong>{f.studentId?.fullName || 'Student'}</strong></td>
                      <td>{f.classId?.name || 'Class'} ({f.studentId?.section || ''})</td>
                      <td>₹{f.amountTotal.toLocaleString()}</td>
                      <td><strong className="text-emerald">₹{f.amountPaid.toLocaleString()}</strong></td>
                      <td><strong className="text-rose">₹{pendingVal.toLocaleString()}</strong></td>
                      <td dangerouslySetInnerHTML={{ __html: statusBadge }}></td>
                      <td>
                        {pendingVal > 0 ? (
                          <button 
                            onClick={() => openPayModal(f._id, f.studentId?.fullName, pendingVal)} 
                            className="btn btn-xs btn-emerald"
                          >
                            <i className="fa-solid fa-cash-register"></i> Collect
                          </button>
                        ) : (
                          <button 
                            onClick={() => openReceiptViewer(f._id, f.paymentHistory[f.paymentHistory.length - 1]?._id)} 
                            className="btn btn-xs btn-outline btn-text"
                          >
                            <i className="fa-solid fa-receipt"></i> Receipts
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted">No fee records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Record Fee Installment">
        <form onSubmit={handlePaymentSubmit} className="modal-form">
          <div className="form-group">
            <label>Student Profile</label>
            <input type="text" value={studentName} className="form-control" readOnly />
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Remaining Balance</label>
              <input type="text" value={`₹${balance.toLocaleString()}`} className="form-control text-rose font-bold" readOnly />
            </div>
            <div className="form-group">
              <label>Payment Amount</label>
              <input 
                type="number" 
                min="1" 
                max={balance}
                value={amountPaid} 
                onChange={e => setAmountPaid(e.target.value)} 
                required 
              />
            </div>
          </div>
          <div className="form-row-double">
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-control" required>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="NetBanking">NetBanking</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash">Cash Handover</option>
              </select>
            </div>
            <div className="form-group">
              <label>Receipt/Transaction ID (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. REC-120481" 
                value={receiptNo}
                onChange={e => setReceiptNo(e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-indigo">Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Receipt Print Viewer Modal */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Receipt Viewer" className="print-friendly-modal">
        <div className="modal-header no-print" style={{ border: 'none', padding: '0 0 15px 0' }}>
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button onClick={handlePrint} className="btn btn-outline btn-xs"><i className="fa-solid fa-print"></i> Print</button>
            <button onClick={() => setIsReceiptModalOpen(false)} className="btn btn-outline btn-xs"><i className="fa-solid fa-xmark"></i> Close</button>
          </div>
        </div>
        
        {receiptData && (
          <div className="modal-body print-content">
            <div className="report-card-document">
              <div className="rc-doc-header">
                <div className="rc-doc-brand">
                  <i className="fa-solid fa-graduation-cap"></i>
                  <h2>EDUNEX ACADEMY</h2>
                </div>
                <div className="rc-doc-title">
                  <h3>FEE PAYMENT RECEIPT</h3>
                  <span>Receipt No: <strong>{receiptData.receiptNo}</strong></span>
                </div>
              </div>

              <div className="rc-doc-meta-info">
                <div className="rc-meta-column">
                  <div className="rc-meta-row"><span>Student Name:</span><strong>{receiptData.studentName}</strong></div>
                  <div className="rc-meta-row"><span>Admission Number:</span><strong>{receiptData.admissionNumber}</strong></div>
                  <div className="rc-meta-row"><span>Class / Section:</span><strong>{receiptData.className} - Section {receiptData.section}</strong></div>
                </div>
                <div className="rc-meta-column">
                  <div className="rc-meta-row"><span>Payment Date:</span><strong>{new Date(receiptData.datePaid).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</strong></div>
                  <div className="rc-meta-row"><span>Payment Method:</span><strong>{receiptData.paymentMethod}</strong></div>
                  <div className="rc-meta-row"><span>Status:</span><strong><span className="badge badge-success">COMPLETED</span></strong></div>
                </div>
              </div>

              <table className="rc-grades-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Academic Tuition Fees - Term Installment Payment</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{receiptData.amountPaid.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="rc-total-summary-box">
                <div className="rc-sum-stat">
                  <span>Total Semester Fees</span>
                  <strong>₹{receiptData.totalFee.toLocaleString()}</strong>
                </div>
                <div className="rc-sum-stat">
                  <span>Total Paid to Date</span>
                  <strong>₹{receiptData.totalPaidSoFar.toLocaleString()}</strong>
                </div>
                <div className="rc-sum-stat">
                  <span>Balance Due</span>
                  <strong className="grade-tag" style={{ color: receiptData.balanceDue > 0 ? '#ef4444' : '#10b981' }}>
                    ₹{receiptData.balanceDue.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="rc-remarks-box">
                <h4>Important terms & conditions</h4>
                <p>This is a computer generated system receipt. No signature is required. Fees once paid are non-refundable and non-transferable under any circumstances.</p>
              </div>

              <div className="rc-doc-signatures">
                <div className="rc-sig-line">
                  <span>Authorized Registrar</span>
                </div>
                <div className="rc-sig-line">
                  <span>Depositor Signature</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
