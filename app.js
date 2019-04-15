var video = null;
var player = null;
var interval_trigger = null;
const NOT_AVAILABLE = "Not available";
var err_msg = "";
const ENGLISH = "en";
const DEFAULT_AUD_LANG = DEFAULT_TXT_LANG = ENGLISH;


$(document).ready(()=>{
    $("#error-card").hide();
    $("#url_submit").click((event)=>{
        $("#error-card").hide();
        event.preventDefault();
        initApp($("#manifest_url").val());
    });

});

function initApp(manifestUri) {
    // Install built-in polyfills to patch browser incompatibilities.
    shaka.polyfill.installAll();

    // Check to see if the browser supports the basic APIs Shaka needs.
    if (shaka.Player.isBrowserSupported()) {
        // Everything looks good!
        if (player != null)
        {
            player.unload(true);
        }
        initPlayer(manifestUri);
    } else {
        // This browser does not have the minimum set of APIs we need.
        console.error('Browser not supported!');
    }
}

array_to_string = (arr)=>{
    let str = '';
    arr.forEach(function(i, index) {
        str +=  i;
        if (index != (arr.length - 1)) {
            str += ', ';
        };
    });
    return str;
};

function initPlayer(manifestUri) {
    // Create a Player instance.
    $("#error-card").hide();
    if (video == null){
        video = document.getElementById('video');
    }
    if (player == null)
    {
        player = new shaka.Player(video);
    }
    window.player = player;
    player.addEventListener('error', onErrorEvent);
    player.setTextTrackVisibility(true);
    player.configure({
        preferredAudioLanguage: ENGLISH,
        preferredTextLanguage: ENGLISH,
        streaming: {
            bufferingGoal: 10,
            rebufferingGoal: 15,
            alwaysStreamText: true
        }
    });

    player.load(manifestUri).then(function() {
    }).catch(onError);  // onError is executed if the asynchronous load fails.

    if (interval_trigger == null)
        clearInterval(interval_trigger);

    interval_trigger = setInterval(()=>{
        stats = player.getStats();
        var_tracks = player.getVariantTracks();
        if (!isNaN(stats.estimatedBandwidth/1000))
            $("#ntwk-info").text( (stats.estimatedBandwidth/1000).toFixed(2)  + " KB/s");
        else
            $("#ntwk-info").text( NOT_AVAILABLE);

        if (isNaN(stats.droppedFrames) ||  isNaN(stats.decodedFrames))
            $("#frame-drop-info").text(NOT_AVAILABLE);
        else
            $("#frame-drop-info").text( stats.droppedFrames + "/ "+ stats.decodedFrames);

        if (!isNaN(stats.playTime) || !isNaN(stats.bufferingTime))
            $("#play-vs-buffer-time").text( (stats.playTime).toFixed(2) + "/ "+ (stats.bufferingTime).toFixed(2) + " sec");

        var max_res = 0, s_max_res = "";
        var s_curr_res = "";
        audio_tracks = player.getAudioLanguages( );
        subtitle_tracks = player.getTextLanguages();
        $("#audio-tracks").text( audio_tracks.length + " - "+ array_to_string(audio_tracks));
        $("#subtitle-tracks").text(subtitle_tracks.length + " - "+  array_to_string(subtitle_tracks));

        var_tracks.forEach((var_trk)=>{
            if (var_trk.active)
            {
                $("#codec-info").text( var_trk.audioCodec + "/ "+var_trk.videoCodec);
                s_curr_res = var_trk.height+" x "+var_trk.width+"@"+var_trk.videoId;
            }

            if (var_trk.type == "variant")
            {
                if (var_trk.height*var_trk.width >= max_res)
                {
                    max_res = var_trk.height*var_trk.width;
                    s_max_res = var_trk.height+" x "+var_trk.width+"@"+var_trk.videoId;
                }
            }
        });
        res_strn = s_curr_res+"/ "+s_max_res;
        if (res_strn.length > 2)
            $("#resolution-info").text(res_strn);
        else
            $("#resolution-info").text(NOT_AVAILABLE);
    }, 1*500);
}

function onErrorEvent(event)
{
    onError(event.detail);
}

function onError(error)
{
    console.error("Error code:", error.code,
                  " severity:", error.severity,
                  " category:", error.category);
    err_msg = "Error code: "+ error.code+ " severity: "+ error.severity+
        " category:"+ error.category;
    $("#error-card").show();
    if (player !=null)  player.unload(true);
    if (interval_trigger == null) clearInterval(interval_trigger);
    $("#error-msg").text(err_msg);
}
