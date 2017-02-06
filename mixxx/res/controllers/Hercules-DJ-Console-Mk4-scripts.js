
/*
i noticed Mk4 looks alot like control mp3 e2, but beside build in sound, (has middle midi-knob, rest are hardware-knob) there is more than meets thye, for one the jogs are 14 bit encoders, as are the pitch knobs, witch i had a hard time figuring out, i think i at least have the barebone set so mk4's extend could be included, for the rest i tweaked the script to my liking, like pitchbend +and- leds lighting up when pushed on, flanger max on startup, silly "automix" fired, hired "scratchmode", 

browsing with jogs supported! only when holding the scratch button to avoid interfering ;)

scratch + mastertempo = flanger enable
mastertempo = keylock

i practicly touched everything exept where says i didnt, like the looping function, i liked so kept original ty dj korg

		hope i contributed, enjoy, edit, rape, whatever u like, DJ26
*/

function HerculesMk4() {}
var ctl1;
var ctl2;
HerculesMk4.antiguoMixCue=1;
standardRpm = 33.33;
alpha = 1/8;
beta = alpha/20;
scratchResetTime = 60;
secondsBlink = 60;  
jogSensitivity = 0.8;
jogSensitivity2 = [jogSensitivity*2];
jogSensitivity3 = [jogSensitivity*8];
jogSensitivity4 = [jogSensitivity*16];
jogSensitivity5 = [jogSensitivity*32];
jogSensitivity6 = [jogSensitivity*64];
scratchButton = 0;
scratchMode = 0;
cuemode = 0;
scratchTimer = 0;
wheelMove = [0,0];
pitchIncrementRelative = 1;
HerculesMk4.sensivityPitch=[5,5];
HerculesMk4.sensivityPitch2=[15,15];
HerculesMk4.sensivityPitch3=[20,20];
HerculesMk4.sensivityPitch4=[25,25];
HerculesMk4.sensivityPitch5=[30,30];
HerculesMk4.sensivityPitch6=[35,35];

HerculesMk4.init = function (id) 
{ // Switch off all LEDs
	for (i=1; i<95; i++) 
	{
		midi.sendShortMsg(0x90, i, 0x00);
	}
	
	midi.sendShortMsg(0xB0,0x7F,0x7F);
	var delay = engine.getValue("[Flanger]", "lfoDelay")*5;
	var depth = engine.getValue("[Flanger]", "lfoDepth")*5;
	var lfoPeriod = engine.getValue("[Flanger]", "lfoPeriod")*5;
	engine.setValue("[Flanger]", "lfoDelay", delay);
	engine.setValue("[Flanger]", "lfoDepth", depth);
	engine.setValue("[Flanger]", "lfoPeriod", lfoPeriod);
	engine.setValue("[Channel1]", "quantize", 1);
	engine.setValue("[Channel2]", "quantize", 1);
	engine.setValue("[Channel1]", "keylock", 1);
	engine.setValue("[Channel2]", "keylock", 1);
	// Switch-on some LEDs for improve the usability
	midi.sendShortMsg(0x90, 46, 0x7F);	// Automix LED
	midi.sendShortMsg(0x90, 14, 0x7F);	// Cue deck A LED
	midi.sendShortMsg(0x90, 34, 0x7F);	// Cue deck B LED
	midi.sendShortMsg(0x90, 17, 0x7F); //loada
	midi.sendShortMsg(0x90, 37, 0x7F); //loadb
	engine.connectControl("[Channel1]", "playposition", "HerculesMk4.playPositionCue");
	engine.connectControl("[Channel2]", "playposition", "HerculesMk4.playPositionCue");
	engine.connectControl("[Channel1]", "loop_start_position", "HerculesMk4.loopStartSetLeds");
	engine.connectControl("[Channel2]", "loop_start_position", "HerculesMk4.loopStartSetLeds");
	engine.connectControl("[Channel1]", "loop_end_position", "HerculesMk4.loopEndSetLeds");
	engine.connectControl("[Channel2]", "loop_end_position", "HerculesMk4.loopEndSetLeds");
};

HerculesMk4.shutdown = function (id) 
{
	// Switch off all LEDs
	for (i=1; i<95; i++)
	{
		midi.sendShortMsg(0x90, i, 0x00);
	}
};

HerculesMk4.scratchMode = function (midino, control, value, status, group) 
{
	// SHIFT BUTTON	
	// The "Automix" button does not exist on mk4, i tried to code all to "scratchmode"
	if (value == 0x7F) 
	{

		// Switch-on some LEDs
		engine.setValue("[Microphone]", "enabled", 0);
		midi.sendShortMsg(0x90, 30, 0x7F);	// Pitchbend - DB
		midi.sendShortMsg(0x90, 31, 0x7F);  // Pitchbend + DB
		midi.sendShortMsg(0x90, 10, 0x7F);  // Pitchbend - D
		midi.sendShortMsg(0x90, 11, 0x7F);  // Pitchbend + DA
		midi.sendShortMsg(0x90, 19, 0x7F);	// Master tempo DA 
		midi.sendShortMsg(0x90, 39, 0x7F);  // Master tempo DB
		superButtonHold = 1;
	}

	// Button released
		
	if (value == 0x00);
	{
		//talkoverDucking;
		// Switch-off some LEDs	
		engine.setValue("[Microphone]", "enabled", 0);
		midi.sendShortMsg(0x90, 30, 0x00);  // Pitchbend - DB
		midi.sendShortMsg(0x90, 31, 0x00);  // Pitchbend + DB
		midi.sendShortMsg(0x90, 10, 0x00);  // Pitchbend - DA
		midi.sendShortMsg(0x90, 11, 0x00);  // Pitchbend + DA
		midi.sendShortMsg(0x90, 19, 0x00);	// Master tempo DA 
		midi.sendShortMsg(0x90, 39, 0x00);  // Master tempo DB
		superButtonHold = 0;
	}
};

// Enable/disable the flanger effect or enable/disable the keylock tempo if shifted
HerculesMk4.masterTempo = function (midino, control, value, status, group) 
{
	if (value && scratchMode == 0)
	{
	engine.setValue(group, "keylock", (engine.getValue(group, "keylock") == 0) ? 1 : 0);
	}
	if (scratchMode == 1 && value)
	{
	engine.setValue(group, "flanger", (engine.getValue(group, "flanger") == 0) ? 1 : 0);
	}
};
HerculesMk4.loadTrack = function (midino, control, value, status, group) 
{//trimmed code to load track regardless if deck is playing, no like? transplant orig code from dj korg
	engine.setValue(group, "LoadSelectedTrack", 1);
	engine.setValue(group, "rate", 0);	
};

HerculesMk4.scroll = function (midino, control, value, status, group) 
{
	//i suggest ignore but not delete, this func gets called from the jogscroll lateron
	if (control == 0x2C && value == 0x7F) 
	{
		//engine.setValue("[Playlist]", "SelectPrevTrack", "1");
	}
	if (control == 0x2B && value == 0x7F) 
	{
		//engine.setValue("[Playlist]", "SelectNextTrack", "1");
	}
};

HerculesMk4.keyButton = function (midino, control, value, status, group) 
{
	// Loop command for the first 4 Key, Hotcues command for the latest 4
	// transplant exact from korg, no j26 edit
	switch (control) 
	{
		// Loop buttons
		case 0x01: case 0x15:  	// K1, Loop in
			if (scratchMode == 1 && value) 
			{
			engine.setValue(group, "loop_start_position", -1);
			engine.setValue(group, "loop_end_position", -1);
			}
			else engine.setValue(group, "loop_in", value ? 1 : 0);
			break;
		case 0x02: case 0x16:	// K2, Loop out
			if (scratchMode == 1 && value) 
			{
			engine.setValue(group, "loop_start_position", -1);
			engine.setValue(group, "loop_end_position", -1);
			}
			else engine.setValue(group, "loop_out", value ? 1 : 0);
			break;
		case 0x03: case 0x17:	// K3, Reloop/Exit
			engine.setValue(group, "reloop_exit", value ? 1 : 0); break;
			break;
		case 0x04: case 0x18:	// K4, Reloop/Exit
			engine.setValue(group, "reloop_exit", value ? 1 : 0);
			break;

		// Hotcue buttons:
		// Simple press: go to the hotcue position
		// Shift (hold down "scrats"): clear the hotcue
		case 0x05: case 0x19 :	// K5
			if (scratchMode == 1) 
			{
//HerculesMk4.holdButton(group, value, "hotcue_1_set", "hotcue_1_clear");
			engine.setValue(group, "hotcue_1_clear", value ? 1 : 0);
			}
			else 
			{
			engine.setValue(group, "hotcue_1_activate", value ? 1 : 0);
			}
			break;

		case 0x06: case 0x1A:	// K6
			if (scratchMode == 1) 
			{
//HerculesMk4.holdButton(group, value, "hotcue_2_set", "hotcue_2_clear");
			engine.setValue(group, "hotcue_2_clear", value ? 1 : 0);
			}
			else
			{
			engine.setValue(group, "hotcue_2_activate", value ? 1 : 0);
			}
			break;

		case 0x07: case 0x1B:	// K7
			if (scratchMode == 1) 
			{
//HerculesMk4.holdButton(group, value, "hotcue_3_set", "hotcue_3_clear");
			engine.setValue(group, "hotcue_3_clear", value ? 1 : 0);
			}
			else
			{
			engine.setValue(group, "hotcue_3_activate", value ? 1 : 0);
			}
			break;

		case 0x08: case 0x1C:	// K8
			if (scratchMode == 1) 
			{
//HerculesMk4.holdButton(group, value, "hotcue_4_set", "hotcue_4_clear");
			engine.setValue(group, "hotcue_4_clear", value ? 1 : 0);
			}
			else
			{
			engine.setValue(group, "hotcue_4_activate", value ? 1 : 0);
			}
			break;
		}
};
///*
HerculesMk4.knobIncrement = function (group, action, minValue, maxValue, centralValue, step, sign) 
{
	// This function allows you to increment a non-linear value like the volume's knob
	// sign must be 1 for positive increment, -1 for negative increment
	semiStep = step/2;
	rangeWidthLeft = centralValue-minValue;
	rangeWidthRight = maxValue-centralValue;
	actual = engine.getValue(group, action);
	
	if (actual < 1) 
	{
		increment = ((rangeWidthLeft)/semiStep)*sign;
	}
	else if (actual > 1) 
	{
		increment = ((rangeWidthRight)/semiStep)*sign;
	}
	else if (actual == 1) 
	{
		increment = (sign == 1) ? rangeWidthRight/semiStep : (rangeWidthLeft/semiStep)*sign;
	}
	if (sign == 1 && actual < maxValue)
	{
		newValue = actual + increment;
	}
	else if (sign == -1 && actual > minValue)
	{
		newValue = actual + increment;
	}
	
	return newValue;
};

HerculesMk4.deck=function(group){
 //channel 1 -->deck 0
 //channel 2 -->deck 1	
 return (group=="[Channel1]") ? 0 : 1;
};

HerculesMk4.selectLed=function(group,led){
 //channel 1 -->led 0
 //channel 2 -->led + 20
 return (group=="[Channel1]") ? led : led+20;
};

HerculesMk4.pitch = function (midino, control, value, status, group) { //14 bit encoder 
//constructed by j26 (construction was brutal, due lack of knowhow, adjustable in many ways)
	if (value == 0x7F || value == 0x01) 
{

		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x01) ? increment : increment * -1;
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
}
	else


        if (value == 0x7E || value == 0x02) 
{
		var increment = 0.010 * HerculesMk4.sensivityPitch2[HerculesMk4.deck(group)];
		increment = (value == 0x02) ? increment : increment * -1;
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
}


	else

	if (value == 0x7D || value == 0x03) 
{
		var increment = 0.015 * HerculesMk4.sensivityPitch3[HerculesMk4.deck(group)];
		increment = (value == 0x03) ? increment : increment * -1;
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
}

	else

	if (value == 0x7C || value == 0x04) 
{
		var increment = 0.020 * HerculesMk4.sensivityPitch4[HerculesMk4.deck(group)];
		increment = (value == 0x04) ? increment : increment * -1;
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
}
	else


	if (value == 0x7B || value == 0x05) 
{
		var increment = 0.025 * HerculesMk4.sensivityPitch5[HerculesMk4.deck(group)];
		increment = (value == 0x05) ? increment : increment * -1;
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
}

	else

	if (value == 0x7A || value == 0x06) 
{
		var increment = 0.030 * HerculesMk4.sensivityPitch6[HerculesMk4.deck(group)];
		increment = (value == 0x06) ? increment : increment * -1;
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
}



}


HerculesMk4.pitchbend = function (midino, control, value, status, group) //j26 flashy edit, love led love this
{
	/*
	if (scratchMode && value) 
	{
	option still open for scripting
	}
	else*/
	
		// Pitchbend +
		if (control == 0x0B || control == 0x1F){
		ctl1 = "11";
		ctl2 = "31";
		engine.setValue(group, "rate_temp_up", value ? 1 : 0);
		midi.sendShortMsg(0x90, HerculesMk4.deck(group) ? ctl2:ctl1, value ? 0x7F:0x00);  // Pitchbend + DA
		return;
		}

		
		// Pitchbend -
		if (control == 0x0A || control == 0x1E){
		ctl1 = "10";
		ctl2 = "30";
		midi.sendShortMsg(0x90,HerculesMk4.deck(group) ? ctl2:ctl1,value ? 0x7F:0x00);
		engine.setValue(group, "rate_temp_down", value ? 1 : 0);
		return;
		}
	
};


HerculesMk4.cue = function (midino, control, value, status, group) //no j26 edit
{
	// Don't set Cue accidentaly at the end of the song
	if(engine.getValue(group, "playposition") <= 0.97) 
	{
		engine.setValue(group, "cue_default", value ? 1 : 0);
	}
	else
	{
		engine.setValue(group, "cue_preview", value ? 1 : 0);
	}

};

HerculesMk4.scratch = function (midino, control, value, status, group) 
{
    if (value)
    {
		if(scratchMode == 0) 
		
	// Enable the scratch mode on the corrisponding deck and start the timer
	scratchTimer = engine.beginTimer(scratchResetTime, "HerculesMk4.wheelOnOff()");	
			midi.sendShortMsg(0x90, 45, 0x7F); // Switch-on the sync led
			midi.sendShortMsg(0x90, 30, 0x7F);	// Pitchbend - DB
			midi.sendShortMsg(0x90, 31, 0x7F);  // Pitchbend + DB
			midi.sendShortMsg(0x90, 10, 0x7F);  // Pitchbend - D
			midi.sendShortMsg(0x90, 11, 0x7F);  // Pitchbend + DA
			midi.sendShortMsg(0x90, 19, 0x7F);	// Master tempo DA 
			midi.sendShortMsg(0x90, 39, 0x7F);  // Master tempo DB
			scratchMode = 1;
			
			//engine.setValue("[Channel1]", "keylock", 0);
			//engine.setValue("[Channel2]", "keylock", 0);
	}
		else
		{ // Disable the scratch mode on the corrisponding deck and stop the timer
			engine.stopTimer(scratchTimer);
			midi.sendShortMsg(0x90, 45, 0x00); // Switch-off the sync led
			midi.sendShortMsg(0x90, 30, 0x00);  // Pitchbend - DB
			midi.sendShortMsg(0x90, 31, 0x00);  // Pitchbend + DB
			midi.sendShortMsg(0x90, 10, 0x00);  // Pitchbend - DA
			midi.sendShortMsg(0x90, 11, 0x00);  // Pitchbend + DA
			midi.sendShortMsg(0x90, 19, 0x00);// Master tempo DA 
			midi.sendShortMsg(0x90, 39, 0x00);  // Master tempo DB
			scratchMode = 0;
		}
	
};

HerculesMk4.sync = function (midino, control, value, status, group) 
{
engine.setValue(group, "beatsync", value ? 1 : 0);
};


// This function is called every "scratchResetTime" seconds and checks if the wheel was moved in the previous interval 
// (every interval last "scratchResetTime" seconds). If the wheel was moved enables the scratch mode, else disables it.
// In this way I have made a simple workaround to simulate the touch-sensitivity of the other controllers.

HerculesMk4.wheelOnOff = function () {
	
	// Wheel Deck A
	if (wheelMove[0]) engine.scratchEnable(1, 128, standardRpm, alpha, beta);
	else engine.scratchDisable(1);
	wheelMove[0] = 0;
	//Wheel Deck B
	if (wheelMove[1]) engine.scratchEnable(2, 128, standardRpm, alpha, beta);
	else engine.scratchDisable(2);
	wheelMove[1] = 0;
};


HerculesMk4.jogWheel = function (midino, control, value, status, group) 
{
var deck = (group == "[Channel1]") ? 1 : 2;
	
	// this function is constructed by j26 TO ENABLE FILEBROWSING WITH JOGS
	// WHILE HOLDING SCRATCH BUTTON i highly recommend && victim was mp3e2's function, 
	// without 14 bit encoding, now it has, enjoy
	if (value == 0x01) 
	{
		if (scratchMode) {

				if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", jogSensitivity);
		}
	}
        if (value == 0x02) 
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", jogSensitivity2);
		}
	}
	if (value == 0x03) 
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", jogSensitivity3);
		}
	}
	else
	if (value == 0x04) 
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");

				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", jogSensitivity4);
		}
	}
	if (value == 0x05) 
	{
		if (scratchMode) {

				if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", jogSensitivity5);
		}
	}
        if (value == 0x06) 
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				engine.setValue("[Playlist]", "SelectNextTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", jogSensitivity6);
		}
	}
	else
        if (value == 0x7F)
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", -jogSensitivity); 
		}
	}
	if (value == 0x7E)
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", -jogSensitivity2); 
		}
	}
	if (value == 0x7D)
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
						}
				}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", -jogSensitivity3); 
		}
	}
        if (value == 0x7C)
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");

						}
				}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", -jogSensitivity4); 
		}
	}
	if (value == 0x7B)
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", -jogSensitivity5); 
		}
	}
	if (value == 0x7A)
	{
		if (scratchMode) {
			if (HerculesMk4.scroll == group, 0x2A, 0x7F) {
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				engine.setValue("[Playlist]", "SelectPrevTrack", "1");
				}
		}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", -jogSensitivity6); 
		}
	}
};

// This function switch-on the blinking of the cue led when the track is going to end and switch off the led 
// when the track is ended //no j26 edit
HerculesMk4.playPositionCue = function (playposition, group) {
	
    var secondsToEnd = engine.getValue(group, "duration") * (1-playposition);
	
	if (secondsToEnd > secondsBlink) { 
		if (group == "[Channel1]") {
			midi.sendShortMsg(0x90,14,0x7F); // Switch-on Cue Led
			midi.sendShortMsg(0x90,62,0x00); // Switch-off  Cue Blink
		}
		else {
			midi.sendShortMsg(0x90,34,0x7F);
			midi.sendShortMsg(0x90,82,0x00);
		}
		
	}

	if (secondsToEnd < secondsBlink && secondsToEnd > 1) { // The song is going to end
		if (group == "[Channel1]") {
			midi.sendShortMsg(0x90,14,0x00);  // Switch-off Cue Led
			midi.sendShortMsg(0x90,62,0x7F);  // Switch-on  Cue Blink
		}
		else {
			midi.sendShortMsg(0x90,34,0x00);
			midi.sendShortMsg(0x90,82,0x7F);
		}
	}
	
	if (secondsToEnd < 1) { // The song is finished
		if (group == "[Channel1]") {
			midi.sendShortMsg(0x90,14,0x00); // Switch-off Cue Led and blink
			midi.sendShortMsg(0x90,62,0x00);
		}
		else {
			midi.sendShortMsg(0x90,34,0x00);
			midi.sendShortMsg(0x90,82,0x00);
		}
	}
		

};

// Switch-on the K1 Led if the loop start is set no  j26 edit
HerculesMk4.loopStartSetLeds = function (loopStartPos, group) 
{
	if (group == "[Channel1]") 
	{
		if (loopStartPos != -1) midi.sendShortMsg(0x90,1,0x7F);
		else midi.sendShortMsg(0x90,1,0x00);
	}
	else	
	{
		if (loopStartPos != -1) midi.sendShortMsg(0x90,21,0x7F);
		else midi.sendShortMsg(0x90,21,0x00);
	}
}

// Switch-on the K2 Led if the loop end is set
HerculesMk4.loopEndSetLeds = function (loopEndPos, group) 
{
	if (group == "[Channel1]") 
	{
		if (loopEndPos != -1) midi.sendShortMsg(0x90,2,0x7F);
		else midi.sendShortMsg(0x90,2,0x00);
	}
	else	
	{
		if (loopEndPos != -1) midi.sendShortMsg(0x90,22,0x7F);
		else midi.sendShortMsg(0x90,22,0x00);
	}
}

HerculesMk4.pfl = function (midino, control, value, status, group) {

	if(value){
	
		engine.setValue(group,"pfl",(engine.getValue(group,"pfl")) ? 0 :1 );
	
		var pfl1=engine.getValue("[Channel1]","pfl");
		var pfl2=engine.getValue("[Channel2]","pfl");
	
		
		var actualMixCue=engine.getValue("[Master]","headMix");
		
		if(pfl1==0 && pfl2==0){
			HerculesMk4.antiguoMixCue=actualMixCue;
			engine.setValue("[Master]","headMix",1);
		}else{			
			if(actualMixCue==1){
				engine.setValue("[Master]","headMix",antiguoMixCue);
			}			
		};
	};	
};

