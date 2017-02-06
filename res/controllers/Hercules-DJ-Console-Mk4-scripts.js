
/*
i noticed Mk4 looks alot like control mp3 e2, but beside build in sound, (has middle midi-knob, rest are hardware-knob) there is more than meets thye, for one the jogs are 14 bit encoders, as are the pitch knobs, witch i had a hard time figuring out, i think i at least have the barebone set so mk4's extend could be included, for the rest i tweaked the script to my liking, like pitchbend +and- leds lighting up when pushed on, flanger max on startup, silly "automix" fired, hired "scratchmode", 

browsing with jogs supported! only when holding the scratch button to avoid interfering ;)

scratch + mastertempo = flanger enable
mastertempo = keylock

i practicly touched everything exept where says i didnt, like the looping function, i liked so kept original ty dj korg

		hope i contributed, enjoy, edit, rape, whatever u like, DJ26
*/

function HerculesMk4() {}

HerculesMk4.antiguoMixCue=1;
standardRpm = 33.33;
alpha = 1/8;
beta = alpha/20;
scratchResetTime = 60;
secondsBlink = 60;  
jogSensitivity = 0.6;
scratchButton = 0;
scratchMode = 0;
folderMode = 0;
fileMode = 0;
cuemode = 0;
scratchTimer = 0;
wheelMove = [0,0];
pitchIncrementRelative = 1;
HerculesMk4.sensivityPitch = [5,5];

HerculesMk4.init = function (id) 
{ // Switch off all LEDs
	for (i=1; i<95; i++) {
		midi.sendShortMsg(0x90, i, 0x00);}
	
	midi.sendShortMsg(0xB0,0x7F,0x7F);
	engine.setValue("[Flanger]", "lfoDelay", 10000);
	engine.setValue("[Flanger]", "lfoDepth", 1);
	engine.setValue("[Flanger]", "lfoPeriod", 2000000);
	engine.setValue("[Channel1]", "quantize", 1);
	engine.setValue("[Channel2]", "quantize", 1);
	engine.setValue("[Channel1]", "keylock", 1);
	engine.setValue("[Channel2]", "keylock", 1);
	// Switch-on some LEDs for improve the usability
	midi.sendShortMsg(0x90, 46, 0x7F);	// Automix LED
	midi.sendShortMsg(0x90, 14, 0x7F);	// Cue deck A LED
	midi.sendShortMsg(0x90, 34, 0x7F);	// Cue deck B LED
	midi.sendShortMsg(0x90, 17, 0x7F); //loada                    midi.sendShortMsg(0x90, 0x11, 0x7F);
	midi.sendShortMsg(0x90, 37, 0x7F); //loadb
	engine.connectControl("[Channel1]", "playposition", "HerculesMk4.playPositionCue");
	engine.connectControl("[Channel2]", "playposition", "HerculesMk4.playPositionCue");
	engine.connectControl("[Channel1]", "loop_start_position", "HerculesMk4.loopStartSetLeds");
	engine.connectControl("[Channel2]", "loop_start_position", "HerculesMk4.loopStartSetLeds");
	engine.connectControl("[Channel1]", "loop_end_position", "HerculesMk4.loopEndSetLeds");
	engine.connectControl("[Channel2]", "loop_end_position", "HerculesMk4.loopEndSetLeds");
};

HerculesMk4.shutdown = function (id){
	// Switch off all LEDs
	for (i=1; i<95; i++){
		midi.sendShortMsg(0x90, i, 0x00);}
};

// Enable/disable the flanger effect or enable/disable the keylock tempo if shifted
HerculesMk4.masterTempo = function (midino, control, value, status, group) 
{
	if (value && scratchMode == 0){
	engine.setValue(group, "keylock", (engine.getValue(group, "keylock") == 0) ? 1 : 0);}
	if (scratchMode == 1 && value){
	engine.setValue(group, "flanger", (engine.getValue(group, "flanger") == 0) ? 1 : 0);}
	if (folderMode == 1 && value){
	engine.setValue("[Recording]", "toggle_recording", 1);
	}
}; 
HerculesMk4.loadTrack = function (midino, control, value, status, group){//trimmed code to load track regardless if deck is playing, no like? transplant orig code from dj korg
	engine.setValue(group, "LoadSelectedTrack", 1);
	engine.setValue(group, "rate", 0);
};
HerculesMk4.fileMode = function (midino, control, value, status, group) {
if (control == 0x2B)
		if (value == 0x7F || value == 0x00){
		midi.sendShortMsg(0x90, 43, (value == 0x7F) ? 0x7F: 0x00); // Switch-on the filemode led
		fileMode = (value == 0x7F) ? 1: 0;
		return;}

};
HerculesMk4.folderMode = function (midino, control, value, status, group){
if (control == 0x2C)
		if (value == 0x7F || value == 0x00){
		midi.sendShortMsg(0x90, 44, (value == 0x7F) ? 0x7F: 0x00); // Switch-on the foldermode led
		folderMode = (value == 0x7F) ? 1: 0;
		return;}
};

HerculesMk4.keyButton = function (midino, control, value, status, group) 
{
	// Loop command for the first 4 Key, Hotcues command for the latest 4
	// transplant exact from korg, 
	switch (control) 
	{ // Loop buttons
		case 0x01: case 0x15:  	// K1, Loop in
			if (scratchMode == 0 && fileMode == 0 && folderMode == 0){ //nomode loop in set
			engine.setValue(group, "loop_in", value ? 1 : 0);
			return;}
			else
			if (scratchMode == 1 && folderMode == 0 && fileMode == 0 && value){ //scratchmode clear loop in
			engine.setValue(group, "loop_start_position", value ? -1: 0);
			return;}
			if (folderMode == 1 && scratchMode == 0 && fileMode == 0 && value){ //foldermode 1 beatloop
			engine.setValue(group, "beatloop_1_activate", value ? 1 : 0); //foldermode func
			return;}
			break;
		case 0x02: case 0x16:	// K2, Loop out
			if (scratchMode == 0 && fileMode == 0 && folderMode == 0){ //nomode loop out set
			engine.setValue(group, "loop_out", value ? 1 : 0);
			return;}
			if (scratchMode == 1 && folderMode == 0 && fileMode == 0 && value){ //scratchmode clear loop out
			engine.setValue(group, "loop_end_position", value ? -1: 0);
			return;}
			else
			if (folderMode == 1 && scratchMode == 0 && fileMode == 0 && value){ //foldermode 2 beatloop
			engine.setValue(group, "beatloop_2_activate", value ? 1 : 0);
			return;}
			break;
		case 0x03: case 0x17:	// K3, Reloop/Exit
			if (scratchMode == 0 && fileMode == 0 && folderMode == 0){
			engine.setValue(group, "reloop_exit", value ? 1 : 0); //reloop exit
			return;}
			else
			if (folderMode == 1 && scratchMode == 0 && fileMode == 0 && value){ //foldermode 4 beatloop
			engine.setValue(group, "beatloop_4_activate", value ? 1 : 0); 
			return;}
			/*if (value && scratchMode == 1 && folderMode == 0 && fileMode == 0){ //experi
				engine.setValue(group, "loop_move_1_backward", value ? 1 : 0);
				return;}*/
			break;
		case 0x04: case 0x18:	// K4, Reloop/Exit
			if (folderMode == 1){ //foldermode 8 beatloop
			engine.setValue(group, "beatloop_8_activate", value ? 1 : 0); //foldermode 8 beatloop
			return;}
			else
			if (scratchMode == 0 && fileMode == 0 && folderMode == 0){ //reloop exit
			engine.setValue(group, "reloop_exit", value ? 1 : 0);
			return;}
			break;
		// Hotcue buttons:
		// Simple press: go to the hotcue position
		// Shift (hold down "scrats"): clear the hotcue
		case 0x05: case 0x19 :	// K5
			if (scratchMode == 1)
			engine.setValue(group, "hotcue_1_clear", value ? 1 : 0);
			else
			if (scratchMode == 0)
			engine.setValue(group, "hotcue_1_activate", value ? 1 : 0);
			break;
		case 0x06: case 0x1A:	// K6
			if (scratchMode == 1)
			engine.setValue(group, "hotcue_2_clear", value ? 1 : 0);
			else
			if (scratchMode == 0)
			engine.setValue(group, "hotcue_2_activate", value ? 1 : 0);
			break;
		case 0x07: case 0x1B:	// K7
			if (scratchMode == 1)
			engine.setValue(group, "hotcue_3_clear", value ? 1 : 0);
			else
			if (scratchMode == 0)
			engine.setValue(group, "hotcue_3_activate", value ? 1 : 0);
			break;
		case 0x08: case 0x1C:	// K8
			if (scratchMode == 1)
			engine.setValue(group, "hotcue_4_clear", value ? 1 : 0);
			else
			if (scratchMode == 0)
			engine.setValue(group, "hotcue_4_activate", value ? 1 : 0);
			break;
	}
};

HerculesMk4.knobIncrement = function (group, action, minValue, maxValue, centralValue, step, sign) 
{
	// This function allows you to increment a non-linear value like the volume's knob
	// sign must be 1 for positive increment, -1 for negative increment
	semiStep = step/2;
	rangeWidthLeft = centralValue-minValue;
	rangeWidthRight = maxValue-centralValue;
	actual = engine.getValue(group, action);
	
	if (actual < 1) {
		increment = ((rangeWidthLeft)/semiStep)*sign;}
	else if (actual > 1){
		increment = ((rangeWidthRight)/semiStep)*sign;}
	else if (actual == 1){
		increment = (sign == 1) ? rangeWidthRight/semiStep : (rangeWidthLeft/semiStep)*sign;}
	if (sign == 1 && actual < maxValue){
		newValue = actual + increment;}
	else if (sign == -1 && actual > minValue){
		newValue = actual + increment;}
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
HerculesMk4.pitch = function (midino, control, value, status, group){ //14 bit encoder 
//constructed by j26 (construction was brutal, due lack of knowhow, adjustable in many ways)
	if (value == 0x7F || value == 0x01){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x01) ? increment: (-increment);
		engine.setValue(group, "rate", engine.getValue(group, "rate") +increment);
		return;}
	if (value == 0x7E || value == 0x02){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x02) ? (increment*2): (-increment*2);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
		return;}
	if (value == 0x7D || value == 0x03){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x03) ? (increment*6): (-increment*6);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
		return;}
	if (value == 0x7C || value == 0x04){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x04) ? (increment*12): (-increment*12);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
		return;}
	if (value == 0x7B || value == 0x05){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x05) ? (increment*24): (-increment*24);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
		return;}
	if (value == 0x7A || value == 0x06){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x06) ? (increment*32): (-increment*32);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);
		return;}
};
/*
HerculesMk4.pitch = function (midino, control, value, status, group){ //14 bit encoder 
//constructed by j26 (construction was brutal, due lack of knowhow, adjustable in many ways)
	if (value == 0x7F || value == 0x01){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x01) ? increment: (-increment);
		engine.setValue(group, "rate", engine.getValue(group, "rate") +increment);}
	if (value == 0x7E || value == 0x02){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x02) ? (increment*2): (-increment*2);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);}
	if (value == 0x7D || value == 0x03){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x03) ? (increment*6): (-increment*6);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);}
	if (value == 0x7C || value == 0x04){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x04) ? (increment*12): (-increment*12);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);}
	if (value == 0x7B || value == 0x05){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x05) ? (increment*24): (-increment*24);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);}
	if (value == 0x7A || value == 0x06){
		var increment = 0.005 * HerculesMk4.sensivityPitch[HerculesMk4.deck(group)];
		increment = (value == 0x06) ? (increment*32): (-increment*32);
		engine.setValue(group, "rate", engine.getValue(group, "rate") + increment);}
};*/


HerculesMk4.pitchbend = function (midino, control, value, status, group) //j26 flashy edit, love led love this
{

	/*if (scratchMode){
		if (control == 0x0B || control == 0x1F){ //pb+
			if (value){
			engine.setValue(group, "loop_move_1_forward", 1)
			}
		}
	}*/
	if (scratchMode == 0){
		// Pitchbend +
		if (control == 0x0B || control == 0x1F){//pb+
		engine.setValue(group, "rate_temp_up", value ? 1 : 0);
		midi.sendShortMsg(0x90, HerculesMk4.deck(group) ? 31:11, value ? 0x7F:0x00);  // Pitchbend + DA
		return;
		}
		// Pitchbend -
		if (control == 0x0A || control == 0x1E){//pb-
		midi.sendShortMsg(0x90,HerculesMk4.deck(group) ? 30:10,value ? 0x7F:0x00);
		engine.setValue(group, "rate_temp_down", value ? 1 : 0);
		return;
		}
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

HerculesMk4.scratch = function (midino, control, value, status, group){
    if (value == 0x7F || value == 0x00)
    {
	// Enable the scratch mode on the corrisponding deck and start the timer
	scratchTimer = (value == 0x7F) ? engine.beginTimer(scratchResetTime, "HerculesMk4.wheelOnOff()"): engine.stopTimer(scratchTimer);	
			midi.sendShortMsg(0x90, 45, (value == 0x7F) ? 0x7F: 0x00); // Switch-on the sync led
			midi.sendShortMsg(0x90, 30, (value == 0x7F) ? 0x7F: 0x00);	// Pitchbend - DB
			midi.sendShortMsg(0x90, 31, (value == 0x7F) ? 0x7F: 0x00);  // Pitchbend + DB
			midi.sendShortMsg(0x90, 10, (value == 0x7F) ? 0x7F: 0x00);  // Pitchbend - D
			midi.sendShortMsg(0x90, 11, (value == 0x7F) ? 0x7F: 0x00);  // Pitchbend + DA
			midi.sendShortMsg(0x90, 19, (value == 0x7F) ? 0x7F: 0x00);	// Master tempo DA 
			midi.sendShortMsg(0x90, 39, (value == 0x7F) ? 0x7F: 0x00);  // Master tempo DB
			midi.sendShortMsg(0x90, 49, (value == 0x7F) ? 0x7F: 0x00);
			midi.sendShortMsg(0x90, 51, (value == 0x7F) ? 0x7F: 0x00);
			midi.sendShortMsg(0x90, 50, (value == 0x7F) ? 0x7F: 0x00);
			midi.sendShortMsg(0x90, 52, (value == 0x7F) ? 0x7F: 0x00);
			midi.sendShortMsg(0x90, 70, (value == 0x7F) ? 0x7F: 0x00);
			midi.sendShortMsg(0x90, 69, (value == 0x7F) ? 0x7F: 0x00);
			midi.sendShortMsg(0x90, 71, (value == 0x7F) ? 0x7F: 0x00);
			midi.sendShortMsg(0x90, 72, (value == 0x7F) ? 0x7F: 0x00);

			scratchMode = (value == 0x7F) ? 1: 0;
	}
};

HerculesMk4.sync = function (midino, control, value, status, group){
engine.setValue(group, "beatsync", value ? 1 : 0);};


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
HerculesMk4.jogWheel = function (midino, control, value, status, group){
	// this function is constructed by j26 TO ENABLE FILEBROWSING WITH JOGS
	// WHILE HOLDING SCRATCH BUTTON i highly recommend && victim was mp3e2's function, 
	// without 14 bit encoding, now it has, enjoy

	if (value == 0x01 || value == 0x7F){
			if (scratchMode) {		
			engine.setValue("[Playlist]", "SelectTrackKnob", (value == 0x01) ? 1: -1);}
		if (value && scratchMode == 0) {
		engine.setValue(group, "jog", (value == 0x01) ? (jogSensitivity): - (jogSensitivity));}
	}
        if (value == 0x02 || value == 0x7E){
			if (scratchMode){
			engine.setValue("[Playlist]", "SelectTrackKnob", (value == 0x02) ? 2: -2);}
		if (value && scratchMode == 0){
		engine.setValue(group, "jog", (value == 0x02) ? (jogSensitivity*2): - (jogSensitivity*2));}
	}
	if (value == 0x03 || value == 0x7D){
			if (scratchMode){
			engine.setValue("[Playlist]", "SelectTrackKnob", (value == 0x03) ? 3: -3);}
		if (value && scratchMode == 0){
		engine.setValue(group, "jog", (value == 0x03) ? (jogSensitivity*4): - (jogSensitivity*4));}
	}
	if (value == 0x04 || value == 0x7C){
			if (scratchMode){
			engine.setValue("[Playlist]", "SelectTrackKnob", (value == 0x04) ? 4: -4);}
		if (value && scratchMode == 0){
		engine.setValue(group, "jog", (value == 0x04) ? (jogSensitivity*12): - (jogSensitivity*12));}
	}
	if (value == 0x05 || value == 0x7B){
			if (scratchMode){
			engine.setValue("[Playlist]", "SelectTrackKnob", (value == 0x05) ? 5: -5);}
		if (value && scratchMode == 0){
		engine.setValue(group, "jog", (value == 0x05) ? (jogSensitivity*32): - (jogSensitivity*32));}
	}
        if (value == 0x06 || value == 0x7A){
			if (scratchMode){
			engine.setValue("[Playlist]", "SelectTrackKnob", (value == 0x06) ? 6: -6);}
		if (value && scratchMode == 0){
		engine.setValue(group, "jog", (value == 0x06) ? (jogSensitivity*64): - (jogSensitivity*64));}
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

// Switch-on the K1 Led if the loop start is set
HerculesMk4.loopStartSetLeds = function (loopStartPos, group) 
{
	if (group == "[Channel1]") 
	{
		if (loopStartPos != -1) midi.sendShortMsg(0x90,1,0x7F);
		else midi.sendShortMsg(0x90,1,0x00);
	}
	if (group == "[Channel2]")	
	{
		if (loopStartPos != -1) midi.sendShortMsg(0x90,21,0x7F);
		else midi.sendShortMsg(0x90,21,0x00);
	}
};

// Switch-on the K2 Led if the loop end is set
HerculesMk4.loopEndSetLeds = function (loopEndPos, group) 
{
	if (group == "[Channel1]") 
	{
		if (loopEndPos != -1) midi.sendShortMsg(0x90,2,0x7F);
		else midi.sendShortMsg(0x90,2,0x00);
	}
	if (group == "[Channel2]")	
	{
		if (loopEndPos != -1) midi.sendShortMsg(0x90,22,0x7F);
		else midi.sendShortMsg(0x90,22,0x00);
	}
};

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

