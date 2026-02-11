(async () => {
    const ctx = document.getElementById('nied_img').getContext('2d');
    const canvas_hidden = document.createElement('canvas');
    const ctx_hidden = canvas_hidden.getContext('2d');
    canvas_hidden.width = 352;
    canvas_hidden.height = 400;
    const audio_level0 = new Audio();
    const audio_level1 = new Audio();
    const audio_level2 = new Audio();
    audio_level0.src = "../sound/level0.mp3";
    audio_level1.src = "../sound/level1.mp3";
    audio_level2.src = "../sound/level2.mp3";
    let swaptime = -1;
    let notification = false;
    let colorData = await fetch('../jsons/colors.json');
    colorData = await colorData.json();
    let placeData = await fetch('../jsons/placenames.json');
    placeData = await placeData.json();
    function getntptime() {
        fetch('http://www.kmoni.bosai.go.jp/webservice/server/pros/latest.json?_=' + new Date().getTime()).then(r => r.json()).then(r => {
            timeoffset = new Date(r.request_time) - new Date().getTime();
        });
    }
    let timeoffset = 0;
    getntptime();
    //timeoffset = new Date('2026/02/11 13:31:10').getTime() - new Date().getTime();
    function getnowtime() {
        const realtime = new Date(new Date() - 1100 + timeoffset);
        const year = realtime.getFullYear();
        const month = ('00' + (realtime.getMonth() + 1)).slice(-2);
        const date = ('00' + realtime.getDate()).slice(-2);
        const hour = ('00' + realtime.getHours()).slice(-2);
        const minute = ('00' + realtime.getMinutes()).slice(-2);
        const second = ('00' + realtime.getSeconds()).slice(-2);
        return [year, month, date, hour, minute, second];
    }
    async function putimage(imagelink) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => { resolve(image); };
            image.src = imagelink;
        });
    };
    async function loadniedimg() {
        const t = getnowtime();
        const nied_img_surface = await putimage(`http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/acmap_s/${t[0]}${t[1]}${t[2]}/${t[0]}${t[1]}${t[2]}${t[3]}${t[4]}${t[5]}.acmap_s.gif`);
        const nied_img_borehole = await putimage(`http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/acmap_b/${t[0]}${t[1]}${t[2]}/${t[0]}${t[1]}${t[2]}${t[3]}${t[4]}${t[5]}.acmap_b.gif`);
        ctx.clearRect(0, 0, 352, 400);
        ctx.drawImage(nied_img_surface, 0, 0, 352, 400);
        ctx_hidden.clearRect(0, 0, 352, 400);
        ctx_hidden.drawImage(nied_img_borehole, 0, 0, 352, 400);
        const intLength = [];
        let reactionPoint_b = 0;
        placeData.forEach((p, num) => {
            let distance_1 = 1000;
            let int = -4;
            const obsColorData_s = ctx.getImageData(p.Point.X, p.Point.Y, 1, 1).data;
            const obsColorData_b = ctx_hidden.getImageData(p.Point.X, p.Point.Y, 1, 1).data;
            const R_s = obsColorData_s[0];
            const G_s = obsColorData_s[1];
            const B_s = obsColorData_s[2];
            if (!(R_s == 0 && G_s == 0 && B_s == 0)) {
                for (const c of colorData) {
                    const distance_2 = Math.abs(c.R - R_s) + Math.abs(c.G - G_s) + Math.abs(c.B - B_s);
                    if (distance_1 > distance_2) {
                        distance_1 = distance_2;
                        int = c.level;
                    }
                }
                intLength.push({ int: int, region: p.Region, x: p.Point.X, y: p.Point.Y });
            }
            const R_b = obsColorData_b[0];
            const G_b = obsColorData_b[1];
            const B_b = obsColorData_b[2];
            distance_1 = 1000;
            int = -4;
            if (!(R_b == 0 && G_b == 0 && B_b == 0)) {
                for (const c of colorData) {
                    const distance_2 = Math.abs(c.R - R_b) + Math.abs(c.G - G_b) + Math.abs(c.B - B_b);
                    if (distance_1 > distance_2) {
                        distance_1 = distance_2;
                        int = c.level;
                    }
                }
                if (int > 0) {
                    reactionPoint_b++;
                }
            }
        });
        intLength.sort((a, b) => b.int - a.int);
        console.log(reactionPoint_b)
        const detectedpoints = [];
        let totaldetectedpoints = 0;
        let makesound = false;
        intLength.forEach((i) => {
            let out = false;
            for (let o of detectedpoints) { if (Math.abs(o.x - i.x) < 22 && Math.abs(o.y - i.y) < 22) { out = true; } }
            if (!out) {
                if (i.int > 0) {
                    let total = 0;
                    let reactionPoint = 0;
                    for (const d of intLength) {
                        if (Math.abs(d.x - i.x) < 13 && Math.abs(d.y - i.y) < 13) {
                            total++;
                            if (d.int > 0) {
                                reactionPoint++;
                            }
                        }
                    }
                    if (reactionPoint / total > (0.8 + ((i.x > 220 && i.x < 240 && i.y > 242 && i.y < 272 || i.x > 32 && i.x < 59 && i.y > 342 && i.y < 400) * 0.1)) && total > 2 && reactionPoint > 1 && reactionPoint_b > 2) {
                        totaldetectedpoints++;
                        let frameColor;
                        let text;
                        if (i.int > 2) {
                            if (!makesound && swaptime == -1 && document.getElementById('sound_lv3').checked) {
                                makesound = true;
                                audio_level2.play();
                            }
                            frameColor = "#f00";
                            if (document.getElementById('notice_lv3').checked) {
                                text = "強い揺れ";
                            }
                        } else {
                            if (i.int > 1) {
                                if (!makesound && swaptime == -1 && document.getElementById('sound_lv2').checked) {
                                    makesound = true;
                                    audio_level1.play();
                                }
                                frameColor = "#ff0";
                                if (document.getElementById('notice_lv2').checked) {
                                text = "中程度の揺れ";
                                }
                            } else {
                                if (!makesound && swaptime == -1 && document.getElementById('sound_lv1').checked) {
                                    makesound = true;
                                    audio_level0.play();
                                }
                                frameColor = "#0f0";
                                if (document.getElementById('notice_lv1').checked) {
                                text = "弱い揺れ";
                                }
                            }
                        }
                        ctx.strokeStyle = frameColor;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(i.x - 12, i.y - 12, 25, 25);
                        detectedpoints.push({ x: i.x, y: i.y });
                        if (!notification && text) {
                            notification = true;
                            const options = {
                                type: "basic",
                                title: "揺れ検出",
                                message: i.region + "で" + text + "を検出しました。",
                                iconUrl: '../images/base_map_w.png'
                            };
                            chrome.notifications.create(options);
                        }
                    }
                }
            }
        });
        if (totaldetectedpoints == 0) {
            notification = false;
        }
        swaptime = swaptime * -1;
    }
    setInterval(loadniedimg, 1000);
    document.getElementById('opensetting').addEventListener('click', function () {
        document.getElementById('setting').style.display = "block";
    });
    document.getElementById('closesetting').addEventListener('click', function () {
        document.getElementById('setting').style.display = "none";
    });
})();