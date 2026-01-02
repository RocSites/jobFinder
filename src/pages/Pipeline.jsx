import './Pipeline.css'

const Pipeline = () => (
    <>
        <div class="main">
            <div class="page-title">Pipeline</div>

            <div class="stats">
                <span>8 active leads</span>
                <span>5 applications sent</span>
                <span>3 interviews</span>
                <span>1 offer</span>
            </div>

            <div class="pipeline-table">
                <div class="pipeline-col">
                    <div class="col-header">Saved <span class="count">2</span></div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">Spotify</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">UX Researcher</a></div>
                        <div class="job-meta">Stockholm | <span class="job-comp">$140k-$165k</span></div>
                    </div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">Stripe</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">Staff Software Engineer</a></div>
                        <div class="job-meta">Remote | <span class="job-comp">$210k-$270k</span></div>
                    </div>
                </div>

                <div class="pipeline-col">
                    <div class="col-header">Applied <span class="count">2</span></div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">Notion</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">Product Manager</a></div>
                        <div class="job-meta">New York, NY | <span class="job-comp">$155k-$180k</span></div>
                    </div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">OpenAI</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">Security Engineer</a></div>
                        <div class="job-meta">San Francisco | <span class="job-comp">$200k-$250k</span></div>
                    </div>
                </div>

                <div class="pipeline-col">
                    <div class="col-header">Interviewing <span class="count">3</span></div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">Figma</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">Senior Product Designer</a></div>
                        <div class="job-meta">San Francisco | <span class="job-comp">$165k-$195k</span></div>
                    </div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">Coinbase</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">Mobile Engineer</a></div>
                        <div class="job-meta">Remote | <span class="job-comp">$185k-$230k</span></div>
                    </div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">Meta</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">Data Scientist</a></div>
                        <div class="job-meta">Menlo Park | <span class="job-comp">$195k-$240k</span></div>
                    </div>
                </div>

                <div class="pipeline-col">
                    <div class="col-header">Offer <span class="count">1</span></div>
                    <div class="job-card" onclick="location.href='lead-detail-view-hn.html'">
                        <div class="job-company">Vercel</div>
                        <div class="job-title"><a href="lead-detail-view-hn.html">Frontend Engineer</a></div>
                        <div class="job-meta">Remote | <span class="job-comp">$175k-$210k</span></div>
                    </div>
                </div>
            </div>
        </div>

    </>
)

export default Pipeline;