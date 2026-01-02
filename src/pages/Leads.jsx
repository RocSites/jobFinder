import './Leads.css'

const Leads = () => (
    <>
        <div class="container">
            <div class="main">
                <div class="page-title">Leads</div>

                <div class="stats">
                    <span>12 leads</span>
                    <span>5 high priority</span>
                    <span>8 active this week</span>
                </div>

                <div class="actions">
                    <a href="#">refresh leads</a>
                    <a href="#">filter</a>
                </div>

                <table class="leads-table">
                    <thead>
                        <tr>
                            <th>Priority</th>
                            <th>Position</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Compensation</th>
                            <th>Contact</th>
                            <th>Email</th>
                            <th>Alt Email</th>
                            <th>Stage</th>
                            <th>Industry</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr >
                            <td><span class="priority priority-high">High</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Senior Product Designer</a></td>
                            <td>Figma</td>
                            <td>San Francisco, CA</td>
                            <td><span class="comp">$165k-$195k</span></td>
                            <td>Sarah Chen</td>
                            <td>sarah.chen@figma.com</td>
                            <td>s.chen@figma.com</td>
                            <td><span class="stage">Recruiter Screen</span></td>
                            <td>Design Tools</td>
                            <td><button class="action-btn saved">✓ saved</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-high">High</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Staff Software Engineer</a></td>
                            <td>Stripe</td>
                            <td>Remote</td>
                            <td><span class="comp">$210k-$270k</span></td>
                            <td>Michael Park</td>
                            <td>m.park@stripe.com</td>
                            <td>michael.park@stripe.com</td>
                            <td><span class="stage">Second Round</span></td>
                            <td>FinTech</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-medium">Medium</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Product Manager</a></td>
                            <td>Notion</td>
                            <td>New York, NY</td>
                            <td><span class="comp">$155k-$180k</span></td>
                            <td>Jessica Torres</td>
                            <td>jessica@notion.so</td>
                            <td>j.torres@notion.so</td>
                            <td><span class="stage">Applied</span></td>
                            <td>Productivity</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-high">High</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Engineering Manager</a></td>
                            <td>Anthropic</td>
                            <td>San Francisco, CA</td>
                            <td><span class="comp">$220k-$280k</span></td>
                            <td>David Kim</td>
                            <td>david@anthropic.com</td>
                            <td>d.kim@anthropic.com</td>
                            <td><span class="stage">Pending Offer</span></td>
                            <td>AI Research</td>
                            <td><button class="action-btn saved">✓ saved</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-low">Low</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">UX Researcher</a></td>
                            <td>Spotify</td>
                            <td>Stockholm, Sweden</td>
                            <td><span class="comp">$140k-$165k</span></td>
                            <td>Emma Larsson</td>
                            <td>e.larsson@spotify.com</td>
                            <td>emma.larsson@spotify.com</td>
                            <td><span class="stage">New</span></td>
                            <td>Music Streaming</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-medium">Medium</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Data Scientist</a></td>
                            <td>Meta</td>
                            <td>Menlo Park, CA</td>
                            <td><span class="comp">$195k-$240k</span></td>
                            <td>Alex Rodriguez</td>
                            <td>arodriguez@meta.com</td>
                            <td>a.rodriguez@meta.com</td>
                            <td><span class="stage">Third Round</span></td>
                            <td>Social Media</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-high">High</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Frontend Engineer</a></td>
                            <td>Vercel</td>
                            <td>Remote</td>
                            <td><span class="comp">$175k-$210k</span></td>
                            <td>Sophie Martin</td>
                            <td>sophie@vercel.com</td>
                            <td>s.martin@vercel.com</td>
                            <td><span class="stage">Offer</span></td>
                            <td>Web Infrastructure</td>
                            <td><button class="action-btn saved">✓ saved</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-medium">Medium</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">DevOps Engineer</a></td>
                            <td>GitLab</td>
                            <td>Austin, TX</td>
                            <td><span class="comp">$160k-$185k</span></td>
                            <td>Ryan O'Brien</td>
                            <td>robrien@gitlab.com</td>
                            <td>ryan.obrien@gitlab.com</td>
                            <td><span class="stage">Recruiter Screen</span></td>
                            <td>Developer Tools</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-low">Low</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Marketing Manager</a></td>
                            <td>Airbnb</td>
                            <td>Los Angeles, CA</td>
                            <td><span class="comp">$125k-$150k</span></td>
                            <td>Maya Patel</td>
                            <td>maya.patel@airbnb.com</td>
                            <td>m.patel@airbnb.com</td>
                            <td><span class="stage">New</span></td>
                            <td>Travel</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-high">High</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Mobile Engineer</a></td>
                            <td>Coinbase</td>
                            <td>Remote</td>
                            <td><span class="comp">$185k-$230k</span></td>
                            <td>James Wilson</td>
                            <td>j.wilson@coinbase.com</td>
                            <td>james.wilson@coinbase.com</td>
                            <td><span class="stage">Second Round</span></td>
                            <td>Cryptocurrency</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-medium">Medium</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Security Engineer</a></td>
                            <td>OpenAI</td>
                            <td>San Francisco, CA</td>
                            <td><span class="comp">$200k-$250k</span></td>
                            <td>Lisa Zhang</td>
                            <td>lisa@openai.com</td>
                            <td>l.zhang@openai.com</td>
                            <td><span class="stage">Applied</span></td>
                            <td>AI Research</td>
                            <td><button class="action-btn">save</button></td>
                        </tr>
                        <tr >
                            <td><span class="priority priority-low">Low</span></td>
                            <td><a href="lead-detail-view-hn.html" class="position-link">Content Strategist</a></td>
                            <td>Shopify</td>
                            <td>Ottawa, Canada</td>
                            <td><span class="comp">$145k-$170k</span></td>
                            <td>Chris Anderson</td>
                            <td>c.anderson@shopify.com</td>
                            <td>chris.anderson@shopify.com</td>
                            <td><span class="stage">Third Round</span></td>
                            <td>E-commerce</td>
                            <td><button class="action-btn saved">✓ saved</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </>

)

export default Leads;