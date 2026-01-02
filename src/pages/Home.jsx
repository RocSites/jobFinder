import './Home.css'
import { Link } from "react-router";

const Home = () => (
    <>
        <div class="container">
            <div class="main">
                <div class="section">
                    <div class="section-header">
                        <span>Your Pipeline</span>
                        <a href="my-pipeline-view-hn.html">view all</a>
                    </div>
                    <div class="pipeline">
                        <div class="pipeline-col">
                            <div class="pipeline-col-header">
                                <span>Saved</span>
                                <span class="count">2</span>
                            </div>
                            <div class="job-item">
                                <div class="job-company">Spotify</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">UX Researcher</a>
                                </div>
                                <div class="job-meta">
                                    Stockholm | <span class="job-comp">$140k-$165k</span>
                                </div>
                            </div>
                            <div class="job-item">
                                <div class="job-company">Stripe</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">Staff Software Engineer</a>
                                </div>
                                <div class="job-meta">
                                    Remote | <span class="job-comp">$210k-$270k</span>
                                </div>
                            </div>
                        </div>

                        <div class="pipeline-col">
                            <div class="pipeline-col-header">
                                <span>Applied</span>
                                <span class="count">2</span>
                            </div>
                            <div class="job-item">
                                <div class="job-company">Notion</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">Product Manager</a>
                                </div>
                                <div class="job-meta">
                                    New York, NY | <span class="job-comp">$155k-$180k</span>
                                </div>
                            </div>
                            <div class="job-item">
                                <div class="job-company">OpenAI</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">Security Engineer</a>
                                </div>
                                <div class="job-meta">
                                    San Francisco | <span class="job-comp">$200k-$250k</span>
                                </div>
                            </div>
                        </div>

                        <div class="pipeline-col">
                            <div class="pipeline-col-header">
                                <span>Interviewing</span>
                                <span class="count">3</span>
                            </div>
                            <div class="job-item">
                                <div class="job-company">Figma</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">Senior Product Designer</a>
                                </div>
                                <div class="job-meta">
                                    San Francisco | <span class="job-comp">$165k-$195k</span>
                                </div>
                            </div>
                            <div class="job-item">
                                <div class="job-company">Coinbase</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">Mobile Engineer</a>
                                </div>
                                <div class="job-meta">
                                    Remote | <span class="job-comp">$185k-$230k</span>
                                </div>
                            </div>
                            <div class="job-item">
                                <div class="job-company">Meta</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">Data Scientist</a>
                                </div>
                                <div class="job-meta">
                                    Menlo Park | <span class="job-comp">$195k-$240k</span>
                                </div>
                            </div>
                        </div>

                        <div class="pipeline-col">
                            <div class="pipeline-col-header">
                                <span>Offer</span>
                                <span class="count">1</span>
                            </div>
                            <div class="job-item">
                                <div class="job-company">Vercel</div>
                                <div class="job-title">
                                    <a href="lead-detail-view-hn.html">Frontend Engineer</a>
                                </div>
                                <div class="job-meta">
                                    Remote | <span class="job-comp">$175k-$210k</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="two-col">
                    <div class="list-section">
                        <div class="section-header">
                            <span>Recent Messages</span>
                            <a href="#">view all</a>
                        </div>
                        <div class="list-item">
                            <div class="unread-dot"></div>
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="#">Offer Letter - Frontend Engineer</a>
                                </div>
                                <div class="item-meta">
                                    from Sophie Martin at Vercel | 2 hours ago
                                </div>
                            </div>
                        </div>
                        <div class="list-item">
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="#">Re: Engineering Manager Interview</a>
                                </div>
                                <div class="item-meta">
                                    from David Kim at Anthropic | 5 hours ago
                                </div>
                            </div>
                        </div>
                        <div class="list-item">
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="#">Next Steps - Figma Design Role</a>
                                </div>
                                <div class="item-meta">
                                    from Sarah Chen at Figma | 1 day ago
                                </div>
                            </div>
                        </div>
                        <div class="list-item">
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="#">Coinbase Technical Round Schedule</a>
                                </div>
                                <div class="item-meta">
                                    from James Wilson at Coinbase | 2 days ago
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="list-section">
                        <div class="section-header">
                            <span>New Leads for You</span>
                            <a href="job-leads-mock-hn.html">view all</a>
                        </div>
                        <div class="list-item" >
                            <div class="item-number">1.</div>
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="job-leads-mock-hn.html">DevOps Engineer</a>
                                </div>
                                <div class="item-meta">
                                    GitLab | Austin, TX | <span class="job-comp">$160k-$185k</span>
                                </div>
                            </div>
                        </div>
                        <div class="list-item" >
                            <div class="item-number">2.</div>
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="job-leads-mock-hn.html">Marketing Manager</a>
                                </div>
                                <div class="item-meta">
                                    Airbnb | Los Angeles | <span class="job-comp">$125k-$150k</span>
                                </div>
                            </div>
                        </div>
                        <div class="list-item">
                            <div class="item-number">3.</div>
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="job-leads-mock-hn.html">Mobile Engineer</a>
                                </div>
                                <div class="item-meta">
                                    Coinbase | Remote | <span class="job-comp">$185k-$230k</span>
                                </div>
                            </div>
                        </div>
                        <div class="list-item" >
                            <div class="item-number">4.</div>
                            <div class="item-content">
                                <div class="item-title">
                                    <a href="job-leads-mock-hn.html">Content Strategist</a>
                                </div>
                                <div class="item-meta">
                                    Shopify | Ottawa | <span class="job-comp">$145k-$170k</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer">
                <a href="#">Guidelines</a> |
                <a href="#">FAQ</a> |
                <a href="#">API</a> |
                <a href="#">Support</a> |
                <a href="#">GitHub</a>
            </div>
        </div>
    </>
)

export default Home