var avg_speed = 0;
var stopDownload = false;
var getClientDetails = function() {
  // Browser details BEGIN
  var nAgt = navigator.userAgent,
      browserName  = navigator.appName,
      version  = ''+parseFloat(navigator.appVersion),
      osName = "Unknown",
      ipAddr = "Unknown",
      device = "Desktop",
      nameOffset,
      verOffset,
      ix;

  if ((verOffset = nAgt.indexOf("Opera")) != -1) {
    browserName = "Opera";
    version = nAgt.substring(verOffset+6);
    if ((verOffset = nAgt.indexOf("Version")) != -1) {
      version = nAgt.substring(verOffset+8);
    }
  } else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
    browserName = "Microsoft Internet Explorer";
    version = nAgt.substring(verOffset+5);
  } else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
    browserName = "Chrome";
    version = nAgt.substring(verOffset+7);
  } else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
    browserName = "Safari";
    version = nAgt.substring(verOffset+7);
    if ((verOffset = nAgt.indexOf("Version")) != -1) {
      version = nAgt.substring(verOffset+8);
    }
  } else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
    browserName = "Firefox";
    version = nAgt.substring(verOffset+8);
  } else if ((nameOffset = nAgt.lastIndexOf(' ')+1) <
            (verOffset = nAgt.lastIndexOf('/'))) {
    browserName = nAgt.substring(nameOffset,verOffset);
    version = nAgt.substring(verOffset+1);
    if (browserName.toLowerCase() == browserName.toUpperCase()) {
      browserName = navigator.appName;
    }
  }
  // trim the version string at semicolon/space if present
  if ((ix = version.indexOf(";")) != -1) {
     version = version.substring(0,ix);
  }
  if ((ix = version.indexOf(" "))!=-1) {
     version = version.substring(0,ix);
  }

  // Screen details BEGIN
  var screenW = 640,
      screenH = 480;

  if (parseInt(navigator.appVersion) > 3) {
    screenW = screen.width;
    screenH = screen.height;
  }
  else if (navigator.appName == "Netscape"
      && parseInt(navigator.appVersion) == 3
      && navigator.javaEnabled()
     ) {
    var jToolkit = java.awt.Toolkit.getDefaultToolkit();
    var jScreenSize = jToolkit.getScreenSize();
    screenW = jScreenSize.width;
    screenH = jScreenSize.height;
  }

  // Cookie status BEGIN
  var cookieEnabled = (navigator.cookieEnabled) ? true : false;

  if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled) {
    document.cookie = "testcookie";
    cookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
  }

  // IE 11:

  if (!!navigator.userAgent.match(/Trident\/7\./)) {
    browserName = "Microsoft Internet Explorer";
    version = 11;
  }

  osMatch = navigator.userAgent.match(/(Mac OS X (\d|_)+|Windows (NT|Phone)( (\d|\.)+)|X11;( U;|) \w+ \w+|Linux (x\d+_\d+|i\d+)|OS (\d|_)+)|Android (\d|\.)+/i);
  if(osMatch.length > 0) {
    osName = osMatch[0].replace(/_/g, ".");
  }

  if(/iPad/.test(navigator.userAgent)) {
    device = "iPad";
  } else if(/iPhone/.test(navigator.userAgent)) {
    device = "iPhone";
  } else if(/iPod/.test(navigator.userAgent)) {
    device = "iPod";
  } else if(/Android/.test(navigator.userAgent)) {
    device = "Android";
  } else if(/Mac/.test(navigator.userAgent)) {
    device = "Mac Desktop";
  } else if(/Windows Phone/.test(navigator.userAgent)) {
    device = "Windows Phone";
  } else if(/Windows NT/.test(navigator.userAgent)) {
    device = "Windows Desktop";
  }

  var r = {"os_name": osName,
           "device": device,
           "browser_name": browserName,
           "browser_version": version,
           "screen_details": screenW + " x " + screenH,
           "cookies_status": cookieEnabled}
  return r;
}

var getFlashVersion = function() {
  // ie
  try {
    try {
      // avoid fp6 minor version lookup issues
      // see: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
      var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
      try { axo.AllowScriptAccess = 'always'; }
      catch(e) { return '6.0.0'; }
    } catch(e) {}
    return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, '.').match(/^\.?(.+)\.?$/)[1];
  // other browsers
  } catch(e) {
    try {
      if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){
        return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ".").match(/^\.?(.+)\.?$/)[1];
      }
    } catch(e) {}
  }
  return "Disabled";
}

var SpeedTest = function() {
  this.requesting = false;
  this.steps;
  this.maxTime = 45000; // if it takes more than 5 minutes abort the download
  this.serverFile = "https://d2codc7s6it0l4.cloudfront.net/test/vzd3a3035684df4c70bc24fc3f76f76d67.mp4";
  this.onprogress = function(speed) {
      $j('#speed_test .buttonNumber').html(speed + " <em>KB/s</em>");;
  };
  this.onload = function(speed) {
      avg_speed = speed;
      $j('#speed_test .progressDesc').html("Average speed");
      $j('#speed_test .buttonNumber').html(speed + " <em>KB/s</em>");
      $j('#speed_test .vzaar-icon-replay').show();
  };
  this.startRequest = function() {
    if(this.requesting) return;
    this.readyForCurSpeed = false;

    $j('#speed_test .buttonDes').show();
    $j('#speed_test .buttonTitle').hide();
    $j('#speed_test .vzaar-icon-replay').hide();
    $j('#speed_test .progressDesc').html("Current speed");

    var o = this,
        xhr;
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    } else { // IE6 fix
      xhr = new ActiveXObject("Microsoft.XMLHTTP");
    };

    xhr.open('GET', this.serverFile + "?ts=" + (new Date).getTime(), true);
    var xhrProgress = function(e) {
      var steps = o.steps,
          progress = e.progress || e.loaded; // Firefox 6 fix
      steps.push([new Date().getTime(), progress]); // Adding time and progression to be able to calculate speed
      var stepsLen = steps.length - 1,
          timeDelta = steps[stepsLen][0] - steps[stepsLen - 1][0],
          progressDelta = steps[stepsLen][1] - steps[stepsLen - 1][1];

      if(o.readyForCurSpeed) {
        var currentSpeed = Math.ceil(progressDelta / timeDelta);
      }

      o.onprogress(o.readyForCurSpeed ? currentSpeed : 0);
    };

    xhr.onprogress = xhrProgress;

    var xhrLoad = function() {
      o.requesting = false;

      var steps = o.steps,
          timeDelta = new Date().getTime() - steps[0][0],
          avgSpeed = Math.ceil(steps[steps.length - 1][1] / timeDelta);

      o.onload(avgSpeed);
    };

    xhr.onload = xhrLoad;

    var form = new FormData();
    form.append('d', 'd');

    // Send
    this.requesting = true;
    this.steps = [[ new Date().getTime(), 0]]; // Initializes the steps list

    this.maxTime && setTimeout(function() { // timeout property isn't supported by many recent web browsers
      if(xhr.readyState < 4) {
        xhr.abort();
        xhrLoad();
      }
    }, this.maxTime);

    setInterval(function() {
      if(stopDownload) {
        xhr.abort();
        xhrLoad();
        stopDownload = false;
      }
    }, 1000);

    setTimeout(function() {
      o.readyForCurSpeed = true;
    }, 2000);

    xhr.send(form);
  };
}

$j(document).ready(function() {
  var firstClick = true;
  client_details = getClientDetails();

  $j('#speed_test').parent().click(function() {
    if(firstClick) {
      STInstance = new SpeedTest();
      STInstance.startRequest();
      firstClick = false;
    } else {
      stopDownload = true;
      firstClick = true;
    }
  });

  $j("#os_details, #device, #screen_details, #flash_details, #speed_test, #browser_details, #cookies_status, #html5_support").parent().removeClass('hiddenButton');

  $j("#os_details").html(client_details["os_name"]);
  $j("#device").html(client_details["device"]);
  $j("#browser_details").html(client_details["browser_name"] + " " + client_details["browser_version"]);
  $j("#screen_details").html(client_details["screen_details"]);
  $j("#flash_details").html(getFlashVersion());
  $j("#javascript_status").html("<i class='icon-ok'></i>Enabled").removeClass('no_enabled').addClass('enabled');

  if(client_details["cookies_status"]) {
    $j("#cookies_status").html("<i class='icon-ok'></i>Enabled");
    $j("#cookies_status").removeClass('no_enabled').addClass('enabled');
  }

  if(getFlashVersion() == "Disabled") {
    $j("#flash_details").addClass("no_enabled");
    $j("#flash_details").html("<i class='icon-remove'></i>Disabled");
  }

  video_element = document.createElement('video');
  html5_video_support = "<i class='icon-remove'></i>Not supported";

  if(typeof(video_element.canPlayType) != "undefined") {
    if(document.createElement('video').canPlayType("video/mp4")) {
      html5_video_support = "<i class='icon-ok'></i>Supported";
      $j("#html5_support").addClass("enabled").removeClass("no_enabled");;
    }
  }

  $j("#html5_support").html(html5_video_support);

  $j("#download_csv").click(function() {
    var csvData = [["Operating System", $j(os_details).text()],
                   ["Screen Resolution", $j(screen_details).text()],
                   ["Web Browser", $j(browser_details).text()],
                   ["IP Address", $j(ip_address).text()],
                   ["Javascript", $j(javascript_status).text()],
                   ["Flash Version", $j(flash_details).text()],
                   ["Cookies", $j(cookies_status).text()],
                   ["HTML5 Video", $j(html5_support).text()],
                   ["Device", $j(device).text()],
                   ["Average internet speed", avg_speed + " KB/s"]];

    var csvContent = "data:text/csv;charset=utf-8,";
    csvData.forEach(function(infoArray, index){
       csvDataString = infoArray.join(",");
       csvContent += csvDataString + "\n";
    });

    this.href = encodeURI(csvContent);
    this.download = "system_details.csv";
  });
});

$j.getJSON("http://jsonip.appspot.com?callback=?", function(response) {
  $j("#ip_address").html(response.ip);
  $j("#ip_address").parent().removeClass('hiddenButton');
});
