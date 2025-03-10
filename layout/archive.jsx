const moment = require('moment');
const { Component, Fragment } = require('inferno');
const Paginator = require('hexo-component-inferno/lib/view/misc/paginator');
const ArticleMedia = require('hexo-component-inferno/lib/view/common/article_media');

module.exports = class extends Component {
    render() {
        const { config, page, site, helper } = this.props;
        const { url_for, cdn, __, date_xml, date } = helper;

        const language = page.lang || page.language || config.language;

        var nameMap = language.indexOf('zh') >= 0 ? 'cn' : 'en';
        // var titleText = language.indexOf('zh') >= 0 ? '文章贡献' : 'Post Calendar';

        // ======================= calculate range.
        var startDate = moment().subtract(0.70, 'years');
        var endDate = moment();
        var rangeArr = '["' + startDate.format('YYYY-MM-DD') + '", "' + endDate.format('YYYY-MM-DD') + '"]';

        // post and count map.
        var dateMap = new Map();
        site.posts.forEach(function (post) {
            var date1 = post.date.format('YYYY-MM-DD');
            var count = dateMap.get(date1);
            dateMap.set(date1, count == null || count == undefined ? 1 : count + 1);
        });

        // loop the data for the current year, generating the number of post per day
        var i = 0;
        var datePosts = '[';
        var dayTime = 3600 * 24 * 1000;
        for (var time = startDate; time <= endDate; time += dayTime) {
            var date1 = moment(time).format('YYYY-MM-DD');
            datePosts = (i === 0 ? datePosts + '["' : datePosts + ', ["') + date1 + '", '
                + (dateMap.has(date1) ? dateMap.get(date1) : 0) + ']';
            i++;
        }
        datePosts += ']';
        // =======================

        function renderArticleList(posts, year, month = null) {
            const time = moment([page.year, page.month ? page.month - 1 : null].filter(i => i !== null));
            return <div>
                    <h3 class="tag is-primary" id="time-now">{month === null ? year : time.locale(language).format('MMMM YYYY')}</h3>
                    <div class="timeline">
                        {posts.map(post => {
                            const categories = post.categories.map(category => ({
                                url: url_for(category.path),
                                name: category.name
                            }));
                            return <ArticleMedia
                                url={url_for(post.link || post.path)}
                                title={post.title}
                                date={date(post.date)}
                                dateXml={date_xml(post.date)}
                                categories={categories}
                                thumbnail={post.thumbnail ? url_for(post.thumbnail) : null} />;
                        })}
                    </div>
                    <br/>
                </div>;
        }

        const echartJsUrl = url_for("/js/echarts.min.js");
        const js = `function loadEchart(){
            if($("#post-calendar").length <= 0){
                return;
            }
            $.getScript('${echartJsUrl}', function () { 
            let myChart = echarts.init(document.getElementById('post-calendar'));
            let option = {
            title: {
                top: 0,
                text: '文章贡献',
                left: 'center',
                textStyle: {
                    color: '#3C4858'
                }
            },
            tooltip: {
                padding: 10,
                backgroundColor: '#555',
                borderColor: '#777',
                borderWidth: 1,
                formatter: function (obj) {
                    var value = obj.value;
                    return '<div style="font-size: 14px;">' + value[0] + '：' + value[1] + '</div>';
                }
            },
            visualMap: {
                show: true,
                showLabel: true,
                categories: [0, 1, 2, 3, 4],
                calculable: true,
                inRange: {
                    symbol: 'rect',
                    color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
                },
                itemWidth: 19,
                itemHeight: 19,
                orient: 'horizontal',
                left: 'center',
                bottom: 0
            },
            calendar: [{
                left: 'center',
                range: ${rangeArr},
                cellSize: [19, 19],
                splitLine: {
                    show: false
                },
                itemStyle: {
                    color: '#196127',
                    borderColor: '#fff',
                    borderWidth: 2
                },
                yearLabel: {
                    show: false
                },
                monthLabel: {
                    nameMap: '${nameMap}',
                    fontSize: 13
                },
                dayLabel: {
                    formatter: '{start}  1st',
                    nameMap: '${nameMap}',
                    fontSize: 13
                }
            }],
            series: [{
                type: 'heatmap',
                coordinateSystem: 'calendar',
                calendarIndex: 0,
                data: ${datePosts}
            }]
        };
        myChart.setOption(option);})};loadEchart();`;

        let articleList;
        if (!page.year) {
            const years = {};
            page.posts.each(p => { years[p.date.year()] = null; });
            articleList = Object.keys(years).sort((a, b) => b - a).map(year => {
                const posts = page.posts.filter(p => p.date.year() === parseInt(year, 10));
                return renderArticleList(posts, year, null);
            });
        } else {
            articleList = renderArticleList(page.posts, page.year, page.month);
        }

        return <Fragment>
            <div className="card">
                <div className="card-content">
                    <div style="post-calendar-pre">
                        <div id="post-calendar"></div>
                    </div>
                    <script src={cdn('jquery', '3.3.1', 'dist/jquery.min.js')}></script>
                    <script type="text/javascript" src={url_for("/js/echarts.min.js")}></script>
                    <script type="text/javascript" dangerouslySetInnerHTML={{__html: js}}></script>
                    {articleList}
                </div>
            </div>
            {page.total > 1 ? <Paginator
                current={page.current}
                total={page.total}
                baseUrl={page.base}
                path={config.pagination_dir}
                urlFor={url_for}
                prevTitle={__('common.prev')}
                nextTitle={__('common.next')} /> : null}
        </Fragment>;
    }
};