var vgsPlayer, poster;
vgsPlayer = videojs('vid1');
//vgsPlayer.poster('https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg');
//vgsPlayer.poster('https://c0.wallpaperflare.com/preview/127/363/717/interior-tv-kangaroo-road.jpg');
vgsPlayer.poster('//raw.githubusercontent.com/tvbd/stream/main/img/t20.png');
/********* LOAD URL *********/
$('#vidlink li a').on('click', function (e) {
//    e.preventDefault();
//    var vidlink = $(this).attr('href');
//    vsgLoadVideo(vidlink);
    //$('#vsg-vurl').val(vidlink);  
    //$('input[type=submit]').click();
});

$(document).ready(function () {

    document.addEventListener('contextmenu', event => event.preventDefault());


    $("#vidlink li").css('display', 'none');
    $("#vidlink .Bangla").css('display', '');

    $(".channel-list .nav-link").click(function () {
        $(".channel-list .nav-link").removeClass('active');

        $(this).addClass('active');

        var ShowClass = $(this).data('type');

        $("#vidlink li").css('display', 'none');
        $("#vidlink ." + ShowClass).css('display', '');
    });

    $(".channel").click(function () {
        var url = $(this).data('link');
        console.log(url);
        vsgLoadVideo(url);

    });

//    $("#vsg-loadvideo").submit(function (e) {
//        e.preventDefault();
//
//        var vidURL = $("#vsg-vurl").val();
//
//        vsgLoadVideo(vidURL);
//
//    });

});


function vsgLoadVideo(vidURL, poster) {
    var type = getType(vidURL);

    if (getId(vidURL))
        poster = "http://img.youtube.com/vi/" + getId(vidURL) + "/hqdefault.jpg";

    vgsPlayer.src({
        "src": vidURL,
        "type": type
    });
    if (poster)
        vgsPlayer.poster(poster);
    else
        //vgsPlayer.poster("//i.imgur.com/aE0LoTe.png");
	    vgsPlayer.poster("//11plus.live/videos/playerback.png");

    // play seem to trigger to fast before Youtube is ready

    //vgsPlayer.pause();
//	vgsPlayer.load();
    vgsPlayer.play();
    /*   setTimeout(function() {
     vgsPlayer.play();
     }, 500); */

    return false;

}


function ytVidId(url) {
    //var p = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;
    //var p = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var p = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;

    if (url.match(p) || getId(url).length == 11)
        return false;
}

/**/
function getId(url) {
    //var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    var match = url.match(regExp);

    if (match && match[2].length == 11) {
        return match[2];
    } else {
        return false;
    }
}

var rtmp_suffix = /^rtmp:\/\//;
var hls_suffix = /\.m3u8/;
var mp4_suffix = /\.(mp4|m4p|m4v|mov)/i;
var hds_suffix = /\.f4m/;
var dash_suffix = /\.mpd/;
var flv_suffix = /\.flv/;
var webm_suffix = /\.webm/;
/* AUDIO */
//var mp3_suffix = /\.mp3/;
var mpeg_suffix = /\.(mp3|m4a)/i;
var ogg_suffix = /\.ogg/;

//var youtube_suffix = /\.youtube.com/;
//var yt_suffix = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=((\w|-){11}))(?:\S+)?$/;
var yt_suffix = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
var dm_suffix = /\.?dailymotion.com/;
var vm_suffix = /\.?vimeo.com/;
/* ADVANCED REGEX */
//      var regVimeo = /^.*(vimeo.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
//      var regDailymotion = /^.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/;
//      var regMetacafe = /^.*(metacafe.com)(\/watch\/)(d+)(.*)/i;
//      var youtube_suffix = /(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

function getType(url) {

    /* AUDIO */
    if (mpeg_suffix.test(url))
        return 'audio/mpeg';
    if (ogg_suffix.test(url))
        return 'audio/ogg';
    if (dash_suffix.test(url))
        return 'application/dash+xml';
    if (rtmp_suffix.test(url))
        return 'rtmp/mp4';
    if (hls_suffix.test(url))
        return 'application/x-mpegurl';
    if (mp4_suffix.test(url))
        return 'video/mp4';
    if (hds_suffix.test(url))
        return 'application/adobe-f4m';
    if (flv_suffix.test(url))
        return 'video/flv';
    if (webm_suffix.test(url))
        return 'video/webm';
    if (yt_suffix.test(url)) {
        //alert(url.match(yt_suffix)[2]);
        //player.poster(ytmaxres(url.match(yt_suffix)[2]));
        //alert(ytmaxres(url.match(yt_suffix)[2]));
        return 'video/youtube';
    }
    if (dm_suffix.test(url))
        return 'video/dailymotion';
    if (vm_suffix.test(url))
        return 'video/vimeo';

    console.log('could not guess link type: "' + url + '" assuming mp4');
    return 'video/mp4';
}
;

function getExt(ext) {

    //if (ext == "youtube") ext = "mp4";
    if (ext == "mp4" || ext == "m4v")
        ext = "m4v";
    if (ext == "ogg" || ext == "ogv")
        ext = "oga";
    if (ext == "webm")
        ext = "webmv";

    return ext;
}

