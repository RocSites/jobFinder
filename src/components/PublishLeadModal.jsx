import { useState } from 'react';

/**
 * Modal component for prompting users to publish leads to the public database
 *
 * Two modes:
 * 1. "rejected" - Single lead publishing (stripped of personal info)
 * 2. "offer_accepted" - Publish all user's saved leads
 */
const PublishLeadModal = ({
  isOpen,
  onClose,
  onConfirm,
  mode, // 'rejected' or 'offer_accepted'
  leadTitle,
  leadCompany,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const isRejected = mode === 'rejected';
  const isOfferAccepted = mode === 'offer_accepted';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isRejected ? 'Share This Lead?' : 'Congratulations!'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {isRejected ? (
            <>
              <p className="modal-instruction" style={{ marginBottom: '16px' }}>
                Sorry to hear this didn't work out.
              </p>
              <p className="modal-instruction">
                Would you like to publish this lead to the public database so others can apply?
              </p>
              <p className="modal-instruction" style={{ marginTop: '12px', fontSize: '8pt', color: '#666' }}>
                Only the company name, position title, and compensation will be shared.
                Your notes, emails, and personal links will not be included.
              </p>
              {leadTitle && leadCompany && (
                <div style={{
                  marginTop: '16px',
                  padding: '8px',
                  background: '#f6f6ef',
                  border: '1px solid #e6e6df',
                  fontSize: '9pt'
                }}>
                  <strong>{leadCompany}</strong> - {leadTitle}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="modal-instruction" style={{ marginBottom: '16px' }}>
                Congratulations on accepting an offer!
              </p>
              <p className="modal-instruction">
                Would you like to publish all your saved leads to the public database
                so others in the community can apply to them?
              </p>
              <p className="modal-instruction" style={{ marginTop: '12px', fontSize: '8pt', color: '#666' }}>
                Only basic job info (company, title, compensation, location) will be shared.
                Your personal notes, emails, and links will not be included.
              </p>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn"
            onClick={onClose}
            disabled={isLoading}
          >
            No, Keep Private
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Publishing...' : (isRejected ? 'Yes, Share Lead' : 'Yes, Share All Leads')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishLeadModal;
