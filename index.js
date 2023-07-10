
var PARAMS;
var SOUND;
var SOUND_VOL = 0.25;
var SAMPLE_RATE = 44100;
var SAMPLE_SIZE = 8;

Params.prototype.query = function () {
  var result = "";
  var that = this;
  $.each(this, function (key, value) {
    if (that.hasOwnProperty(key))
      result += "&" + key + "=" + value;
  });
  return result.substring(1);
};

function gen(fx) {
  PARAMS = new Params();
  PARAMS.sound_vol = SOUND_VOL;
  PARAMS.sample_rate = SAMPLE_RATE;
  PARAMS.sample_size = SAMPLE_SIZE;
  if (fx.indexOf("#") == 0) {
    PARAMS.fromB58(fx.slice(1));
    $("#wav").text("random.wav").attr("download", "random.wav");
  } else {
    PARAMS[fx]();
    $("#wav").text("Download" + ".wav").attr("download", fx + ".wav");
  }
  updateUi();
  play();
}

function mut() {
  PARAMS.mutate();
  updateUi();
  play();
}

function play(noregen) {
  if (!noregen) {
    var b58 = PARAMS.toB58();
    if (document.location.href.indexOf("#") != -1) {
      document.location.hash = PARAMS.toB58();
    }
    //$("#permalink").attr("href", "#" + b58)
    //$("#permalink").text(b58)
    $("#copybuffer").val(b58);
    $("#share").attr("href", "#" + b58)
    SOUND = new SoundEffect(PARAMS).generate();
    $("#file_size").text(Math.round(SOUND.wav.length / 1024) + "kB");
    $("#num_samples").text(SOUND.header.subChunk2Size /
      (SOUND.header.bitsPerSample >> 3));
    $("#clipping").text(SOUND.clipping);
  }

  $("#wav").attr("href", SOUND.dataURI);
  $("#sfx").attr("href", "sfx.wav?" + PARAMS.query());

  SOUND.getAudio().play();
}

function copy() {
  var b = $("#copybuffer");
  b.css("display", "block");
  //b.val($("#permalink").text());
  b.select();
  document.execCommand("copy");
  b.css("display", "none");
}

function serialize_params() {
  $("textarea").val(JSON.stringify(PARAMS, null, 2));
  $("#serialize").show();
}

function deserialize_params() {
  var newPARAMS = JSON.parse($("textarea").val());
  PARAMS.fromJSON(newPARAMS);
  play();
  updateUi();
}

function disenable() {
  var duty = PARAMS.wave_type == SQUARE || PARAMS.wave_type == SAWTOOTH;
  $("#p_duty").slider("option", "disabled", !duty);
  $("#p_duty_ramp").slider("option", "disabled", !duty);
}

function updateUi() {
  $.each(PARAMS, function (param, value) {
    if (param == "wave_type") {
      $("#shape input:radio[value=" + value + "]").
        prop('checked', true).button("refresh");
    } else if (param == "sample_rate") {
      $("#hz input:radio[value=" + value + "]").
        prop('checked', true).button("refresh");
    } else if (param == "sample_size") {
      $("#bits input:radio[value=" + value + "]").
        prop('checked', true).button("refresh");
    } else {
      var id = "#" + param;
      $(id).slider("value", 1000 * value);
      $(id).each(function () { convert(this, PARAMS[this.id]); });
    }
  });
  disenable();
}


$(function () {
  $("#shape").buttonset();
  $("#hz").buttonset();
  $("#bits").buttonset();
  $("#shape input:radio").change(function (event) {
    PARAMS.wave_type = parseInt(event.target.value);
    disenable();
    play();
  });
  $("#hz input:radio").change(function (event) {
    SAMPLE_RATE = PARAMS.sample_rate = parseInt(event.target.value);
    play();
  });
  $("#bits input:radio").change(function (event) {
    SAMPLE_SIZE = PARAMS.sample_size = parseInt(event.target.value);
    play();
  });
  $("button").button();
  $(".slider").slider({
    value: 1000,
    min: 0,
    max: 1000,
    slide: function (event, ui) {
      convert(event.target, ui.value / 1000.0);
    },
    change: function (event, ui) {
      if (event.originalEvent) {
        PARAMS[event.target.id] = ui.value / 1000.0;
        convert(event.target, PARAMS[event.target.id]);
        play();
      }
    }
  });
  $(".slider").filter(".signed").
    slider("option", "min", -1000).
    slider("value", 0);
  $('.slider').each(function () {
    var is = this.id;
    if (!$('label[for="' + is + '"]').length)
      $(this).parent().parent().find('th').append($('<label>',
        { for: is }));
  });

  for (var p in sliders) {
    var control = $('#' + p)[0];
    control.convert = sliders[p];
    control.units = units[p];
  }

  gen(document.location.hash || "pickupCoin");
});

function convert(control, v) {
  if (control.convert) {
    v = control.convert(v);
    control.convertedValue = v;
    if (typeof control.units === 'function')
      v = control.units(v);
    else
      v = v.toPrecision(4) + ' ' + control.units;
    $('label[for="' + control.id + '"]').html(v);
  }
}

