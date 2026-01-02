import { useParams } from "react-router-dom";

const LeadDetail = () => {
  const { leadId } = useParams();

  return (
    <>
      <p>Lead ID: {leadId}</p>
      <div className="main">
        <div className="page-header">
          <a href="javascript:history.back()" className="back-link">← back</a>
          <div className="page-title">Engineering Manager</div>
          <div className="page-subtitle">Anthropic | San Francisco, CA</div>
        </div>

        <div className="content-grid">
          <div className="main-col">
            <div className="section">
              <div className="section-title">Basic Information</div>
              <table className="form-table">
                <tr>
                  <td>Position</td>
                  <td><input type="text" defaultValue="Engineering Manager" />
</td>
                </tr>
                <tr>
                  <td>Company</td>
                  <td><input type="text" defaultValue="Anthropic"/></td>
                </tr>
                <tr>
                  <td>Location</td>
                  <td><input type="text" defaultValue="San Francisco, CA"/></td>
                </tr>
                <tr>
                  <td>Compensation</td>
                  <td><input type="text" defaultValue="$220k-$280k" className="comp-value"/></td>
                </tr>
                <tr>
                  <td>Priority</td>
                  <td>
                    <select>
                      <option selected>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>Stage</td>
                  <td>
                    <select>
                      <option>New</option>
                      <option>Applied</option>
                      <option>Recruiter Screen</option>
                      <option>Second Round</option>
                      <option>Third Round</option>
                      <option selected>Pending Offer</option>
                      <option>Offer</option>
                      <option>Rejected</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td>Industry</td>
                  <td><input type="text" defaultValue="AI Research"/></td>
                </tr>
                <tr>
                  <td>Job URL</td>
                  <td><input type="text" defaultValue="https://anthropic.com/careers/123"/></td>
                </tr>
              </table>
            </div>

            <div className="section">
              <div className="section-title">Contact Information</div>
              <table className="form-table">
                <tr>
                  <td>Contact Name</td>
                  <td><input type="text" defaultValue="David Kim"/></td>
                </tr>
                <tr>
                  <td>Primary Email</td>
                  <td><input type="text" defaultValue="david@anthropic.com"/></td>
                </tr>
                <tr>
                  <td>Alt Email</td>
                  <td><input type="text" defaultValue="d.kim@anthropic.com"/></td>
                </tr>
                <tr>
                  <td>LinkedIn</td>
                  <td><input type="text" defaultValue="linkedin.com/in/davidkim"/></td>
                </tr>
                <tr>
                  <td>Phone</td>
                  <td><input type="text" defaultValue="+1 (415) 555-0123"/></td>
                </tr>
                <tr>
                  <td>Notes</td>
                  <td><textarea>Met David at AI Safety conference. Very interested in my background with distributed systems.</textarea></td>
                </tr>
              </table>
            </div>

            <div className="actions">
              <button className="btn btn-primary">Save Changes</button>
              <button className="btn btn-danger">Delete Lead</button>
            </div>
          </div>

          <div className="side-col">
            <div className="section">
              <div className="section-title">Activity & Notes</div>

              <div className="activity-item">
                <div className="activity-meta">2 hours ago | system</div>
                <div className="activity-text">Stage updated to "Pending Offer"</div>
              </div>

              <div className="activity-item">
                <div className="activity-meta">1 day ago | john_doe</div>
                <div className="activity-text">Final interview went really well. Discussed team structure and upcoming projects. David mentioned offer decision by end of week.</div>
              </div>

              <div className="activity-item">
                <div className="activity-meta">3 days ago | system</div>
                <div className="activity-text">Stage updated to "Third Round"</div>
              </div>

              <div className="activity-item">
                <div className="activity-meta">5 days ago | john_doe</div>
                <div className="activity-text">Technical interview scheduled for tomorrow 2pm PT. Preparing system design case study.</div>
              </div>

              <div className="activity-item">
                <div className="activity-meta">1 week ago | system</div>
                <div className="activity-text">Stage updated to "Second Round"</div>
              </div>

              <div className="activity-item">
                <div className="activity-meta">1 week ago | john_doe</div>
                <div className="activity-text">Great initial conversation with David. Team is focused on scaling Claude infrastructure. Looking for someone with my exact background.</div>
              </div>

              <div className="activity-item">
                <div className="activity-meta">2 weeks ago | system</div>
                <div className="activity-text">Lead saved to pipeline</div>
              </div>

              <div className="add-note">
                <textarea placeholder="Add a note..."></textarea>
                <button className="btn btn-primary">Add Note</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>

  );
};

export default LeadDetail;
