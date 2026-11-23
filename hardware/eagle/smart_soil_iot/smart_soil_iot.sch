<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE eagle SYSTEM "eagle.dtd">
<eagle version="6.5">
<drawing>
<settings>
<setting alwaysvectorfont="no"/>
<setting verticaltext="up"/>
</settings>
<grid distance="0.1" unitdist="inch" unit="inch" style="lines" multiple="1" display="no" altdistance="0.01" altunitdist="inch" altunit="inch"/>
<layers>
<layer number="1" name="Top" color="4" fill="1" visible="yes" active="yes"/>
<layer number="16" name="Bottom" color="1" fill="1" visible="yes" active="yes"/>
<layer number="17" name="Pads" color="2" fill="1" visible="yes" active="yes"/>
<layer number="18" name="Vias" color="2" fill="1" visible="yes" active="yes"/>
<layer number="19" name="Unrouted" color="6" fill="1" visible="yes" active="yes"/>
<layer number="20" name="Dimension" color="15" fill="1" visible="yes" active="yes"/>
<layer number="21" name="tPlace" color="7" fill="1" visible="yes" active="yes"/>
<layer number="22" name="bPlace" color="7" fill="1" visible="yes" active="yes"/>
<layer number="23" name="tOrigins" color="15" fill="1" visible="yes" active="yes"/>
<layer number="24" name="bOrigins" color="15" fill="1" visible="yes" active="yes"/>
<layer number="25" name="tNames" color="7" fill="1" visible="yes" active="yes"/>
<layer number="26" name="bNames" color="7" fill="1" visible="yes" active="yes"/>
<layer number="27" name="tValues" color="7" fill="1" visible="yes" active="yes"/>
<layer number="28" name="bValues" color="7" fill="1" visible="yes" active="yes"/>
<layer number="29" name="tStop" color="7" fill="3" visible="no" active="yes"/>
<layer number="30" name="bStop" color="7" fill="6" visible="no" active="yes"/>
<layer number="31" name="tCream" color="7" fill="4" visible="no" active="yes"/>
<layer number="32" name="bCream" color="7" fill="5" visible="no" active="yes"/>
<layer number="33" name="tFinish" color="6" fill="3" visible="no" active="yes"/>
<layer number="34" name="bFinish" color="6" fill="6" visible="no" active="yes"/>
<layer number="35" name="tGlue" color="7" fill="4" visible="no" active="yes"/>
<layer number="36" name="bGlue" color="7" fill="5" visible="no" active="yes"/>
<layer number="37" name="tTest" color="7" fill="1" visible="no" active="yes"/>
<layer number="38" name="bTest" color="7" fill="1" visible="no" active="yes"/>
<layer number="39" name="tKeepout" color="4" fill="11" visible="yes" active="yes"/>
<layer number="40" name="bKeepout" color="1" fill="11" visible="no" active="yes"/>
<layer number="41" name="tRestrict" color="4" fill="10" visible="yes" active="yes"/>
<layer number="42" name="bRestrict" color="1" fill="10" visible="no" active="yes"/>
<layer number="43" name="vRestrict" color="2" fill="10" visible="no" active="yes"/>
<layer number="44" name="Drills" color="7" fill="1" visible="no" active="yes"/>
<layer number="45" name="Holes" color="7" fill="1" visible="yes" active="yes"/>
<layer number="46" name="Milling" color="3" fill="1" visible="no" active="yes"/>
<layer number="47" name="Measures" color="7" fill="1" visible="no" active="yes"/>
<layer number="48" name="Document" color="7" fill="1" visible="yes" active="yes"/>
<layer number="49" name="Reference" color="7" fill="1" visible="yes" active="yes"/>
<layer number="51" name="tDocu" color="7" fill="1" visible="yes" active="yes"/>
<layer number="52" name="bDocu" color="7" fill="1" visible="yes" active="yes"/>
<layer number="91" name="Nets" color="2" fill="1" visible="yes" active="yes"/>
<layer number="92" name="Busses" color="1" fill="1" visible="yes" active="yes"/>
<layer number="93" name="Pins" color="2" fill="1" visible="yes" active="yes"/>
<layer number="94" name="Symbols" color="4" fill="1" visible="yes" active="yes"/>
<layer number="95" name="Names" color="7" fill="1" visible="yes" active="yes"/>
<layer number="96" name="Values" color="7" fill="1" visible="yes" active="yes"/>
<layer number="97" name="Info" color="7" fill="1" visible="yes" active="yes"/>
<layer number="98" name="Guide" color="6" fill="1" visible="yes" active="yes"/>
</layers>
<schematic xreflabel="%F%N/%S.%C%R" xrefpart="/%S.%C%R">
<libraries>
<library name="smart_soil_lib">
<packages>

<package name="TERM_2P">
<wire x1="-5.50" y1="-4.25" x2="5.50" y2="-4.25" width="0.2032" layer="21"/>
<wire x1="5.50" y1="-4.25" x2="5.50" y2="4.25" width="0.2032" layer="21"/>
<wire x1="5.50" y1="4.25" x2="-5.50" y2="4.25" width="0.2032" layer="21"/>
<wire x1="-5.50" y1="4.25" x2="-5.50" y2="-4.25" width="0.2032" layer="21"/>
<text x="-5.50" y="5.05" size="1.27" layer="25">&gt;NAME</text>
<text x="-5.50" y="-6.25" size="1.016" layer="27">&gt;VALUE</text>

<pad name="1" x="-2.54" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="2.54" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="TERM_3P">
<wire x1="-8.00" y1="-4.25" x2="8.00" y2="-4.25" width="0.2032" layer="21"/>
<wire x1="8.00" y1="-4.25" x2="8.00" y2="4.25" width="0.2032" layer="21"/>
<wire x1="8.00" y1="4.25" x2="-8.00" y2="4.25" width="0.2032" layer="21"/>
<wire x1="-8.00" y1="4.25" x2="-8.00" y2="-4.25" width="0.2032" layer="21"/>
<text x="-8.00" y="5.05" size="1.27" layer="25">&gt;NAME</text>
<text x="-8.00" y="-6.25" size="1.016" layer="27">&gt;VALUE</text>

<pad name="1" x="-5.08" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="0" y="0" drill="1.3" diameter="2.54"/>
<pad name="3" x="5.08" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="TERM_4P">
<wire x1="-10.50" y1="-4.25" x2="10.50" y2="-4.25" width="0.2032" layer="21"/>
<wire x1="10.50" y1="-4.25" x2="10.50" y2="4.25" width="0.2032" layer="21"/>
<wire x1="10.50" y1="4.25" x2="-10.50" y2="4.25" width="0.2032" layer="21"/>
<wire x1="-10.50" y1="4.25" x2="-10.50" y2="-4.25" width="0.2032" layer="21"/>
<text x="-10.50" y="5.05" size="1.27" layer="25">&gt;NAME</text>
<text x="-10.50" y="-6.25" size="1.016" layer="27">&gt;VALUE</text>

<pad name="1" x="-7.62" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="-2.54" y="0" drill="1.3" diameter="2.54"/>
<pad name="3" x="2.54" y="0" drill="1.3" diameter="2.54"/>
<pad name="4" x="7.62" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="FUSE_HOLDER">
<wire x1="-9.00" y1="-3.75" x2="9.00" y2="-3.75" width="0.2032" layer="21"/>
<wire x1="9.00" y1="-3.75" x2="9.00" y2="3.75" width="0.2032" layer="21"/>
<wire x1="9.00" y1="3.75" x2="-9.00" y2="3.75" width="0.2032" layer="21"/>
<wire x1="-9.00" y1="3.75" x2="-9.00" y2="-3.75" width="0.2032" layer="21"/>
<text x="-9.00" y="4.55" size="1.27" layer="25">&gt;NAME</text>
<text x="-9.00" y="-5.75" size="1.016" layer="27">&gt;VALUE</text>

<pad name="1" x="-7.62" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="7.62" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="INA226_MOD">
<wire x1="-13.00" y1="-8.00" x2="13.00" y2="-8.00" width="0.2032" layer="21"/>
<wire x1="13.00" y1="-8.00" x2="13.00" y2="8.00" width="0.2032" layer="21"/>
<wire x1="13.00" y1="8.00" x2="-13.00" y2="8.00" width="0.2032" layer="21"/>
<wire x1="-13.00" y1="8.00" x2="-13.00" y2="-8.00" width="0.2032" layer="21"/>
<text x="-13.00" y="8.80" size="1.27" layer="25">&gt;NAME</text>
<text x="-13.00" y="-10.00" size="1.016" layer="27">&gt;VALUE</text>

<pad name="VIN+" x="-10.16" y="5.08" drill="1.2" diameter="2.2" shape="square"/>
<pad name="VIN-" x="-10.16" y="-5.08" drill="1.2" diameter="2.2"/>
<pad name="VCC" x="10.16" y="5.08" drill="1.0" diameter="1.9"/>
<pad name="GND" x="10.16" y="2.54" drill="1.0" diameter="1.9"/>
<pad name="SCL" x="10.16" y="-2.54" drill="1.0" diameter="1.9"/>
<pad name="SDA" x="10.16" y="-5.08" drill="1.0" diameter="1.9"/>
</package>

<package name="CN3791_MOD">
<wire x1="-14.00" y1="-9.50" x2="14.00" y2="-9.50" width="0.2032" layer="21"/>
<wire x1="14.00" y1="-9.50" x2="14.00" y2="9.50" width="0.2032" layer="21"/>
<wire x1="14.00" y1="9.50" x2="-14.00" y2="9.50" width="0.2032" layer="21"/>
<wire x1="-14.00" y1="9.50" x2="-14.00" y2="-9.50" width="0.2032" layer="21"/>
<text x="-14.00" y="10.30" size="1.27" layer="25">&gt;NAME</text>
<text x="-14.00" y="-11.50" size="1.016" layer="27">&gt;VALUE</text>

<pad name="IN+" x="-11.43" y="5.08" drill="1.3" diameter="2.4" shape="square"/>
<pad name="IN-" x="-11.43" y="-5.08" drill="1.3" diameter="2.4"/>
<pad name="BAT+" x="11.43" y="5.08" drill="1.3" diameter="2.4"/>
<pad name="BAT-" x="11.43" y="-5.08" drill="1.3" diameter="2.4"/>
</package>

<package name="DCDC_5V_MOD">
<wire x1="-14.00" y1="-9.50" x2="14.00" y2="-9.50" width="0.2032" layer="21"/>
<wire x1="14.00" y1="-9.50" x2="14.00" y2="9.50" width="0.2032" layer="21"/>
<wire x1="14.00" y1="9.50" x2="-14.00" y2="9.50" width="0.2032" layer="21"/>
<wire x1="-14.00" y1="9.50" x2="-14.00" y2="-9.50" width="0.2032" layer="21"/>
<text x="-14.00" y="10.30" size="1.27" layer="25">&gt;NAME</text>
<text x="-14.00" y="-11.50" size="1.016" layer="27">&gt;VALUE</text>

<pad name="IN+" x="-11.43" y="5.08" drill="1.3" diameter="2.4" shape="square"/>
<pad name="IN-" x="-11.43" y="-5.08" drill="1.3" diameter="2.4"/>
<pad name="OUT+" x="11.43" y="5.08" drill="1.3" diameter="2.4"/>
<pad name="OUT-" x="11.43" y="-5.08" drill="1.3" diameter="2.4"/>
</package>

<package name="ESP32_S3_N16R8">
<wire x1="-28.00" y1="-14.00" x2="28.00" y2="-14.00" width="0.2032" layer="21"/>
<wire x1="28.00" y1="-14.00" x2="28.00" y2="14.00" width="0.2032" layer="21"/>
<wire x1="28.00" y1="14.00" x2="-28.00" y2="14.00" width="0.2032" layer="21"/>
<wire x1="-28.00" y1="14.00" x2="-28.00" y2="-14.00" width="0.2032" layer="21"/>
<text x="-28.00" y="14.80" size="1.27" layer="25">&gt;NAME</text>
<text x="-28.00" y="-16.00" size="1.016" layer="27">&gt;VALUE</text>

<pad name="3V3" x="-22.86" y="12.7" drill="1.0" diameter="1.7" shape="square"/>
<pad name="GPIO4" x="-17.78" y="12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO5" x="-12.70" y="12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO6" x="-7.62" y="12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO7" x="-2.54" y="12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO8_SDA" x="5.08" y="12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO9_SCL" x="10.16" y="12.7" drill="1.0" diameter="1.7"/>
<pad name="5V" x="-22.86" y="-12.7" drill="1.0" diameter="1.7"/>
<pad name="GND" x="-17.78" y="-12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO17_TX" x="2.54" y="-12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO18_RX" x="7.62" y="-12.7" drill="1.0" diameter="1.7"/>
<pad name="GPIO21_BUZ" x="15.24" y="-12.7" drill="1.0" diameter="1.7"/>
</package>

<package name="BUZZER_5V">
<circle x="0" y="0" radius="6.0" width="0.2032" layer="21"/>
<text x="-5.0" y="7.0" size="1.27" layer="25">&gt;NAME</text>
<text x="-5.0" y="-8.5" size="1.016" layer="27">&gt;VALUE</text>
<pad name="+" x="-3.81" y="0" drill="1.0" diameter="2.0" shape="square"/>
<pad name="-" x="3.81" y="0" drill="1.0" diameter="2.0"/>
</package>

<package name="TO92_S8050">
<wire x1="-2.75" y1="-2.25" x2="2.75" y2="-2.25" width="0.2032" layer="21"/>
<wire x1="2.75" y1="-2.25" x2="2.75" y2="2.25" width="0.2032" layer="21"/>
<wire x1="2.75" y1="2.25" x2="-2.75" y2="2.25" width="0.2032" layer="21"/>
<wire x1="-2.75" y1="2.25" x2="-2.75" y2="-2.25" width="0.2032" layer="21"/>
<text x="-2.75" y="3.05" size="1.27" layer="25">&gt;NAME</text>
<text x="-2.75" y="-4.25" size="1.016" layer="27">&gt;VALUE</text>

<pad name="E" x="-2.54" y="0" drill="0.8" diameter="1.6" shape="square"/>
<pad name="B" x="0" y="0" drill="0.8" diameter="1.6"/>
<pad name="C" x="2.54" y="0" drill="0.8" diameter="1.6"/>
</package>

<package name="AXIAL_RES">
<wire x1="-4.00" y1="-1.40" x2="4.00" y2="-1.40" width="0.2032" layer="21"/>
<wire x1="4.00" y1="-1.40" x2="4.00" y2="1.40" width="0.2032" layer="21"/>
<wire x1="4.00" y1="1.40" x2="-4.00" y2="1.40" width="0.2032" layer="21"/>
<wire x1="-4.00" y1="1.40" x2="-4.00" y2="-1.40" width="0.2032" layer="21"/>
<text x="-4.00" y="2.20" size="1.27" layer="25">&gt;NAME</text>
<text x="-4.00" y="-3.40" size="1.016" layer="27">&gt;VALUE</text>

<pad name="1" x="-5.08" y="0" drill="0.8" diameter="1.6"/>
<pad name="2" x="5.08" y="0" drill="0.8" diameter="1.6"/>
</package>

<package name="DIODE_SS34">
<wire x1="-4.50" y1="-2.00" x2="4.50" y2="-2.00" width="0.2032" layer="21"/>
<wire x1="4.50" y1="-2.00" x2="4.50" y2="2.00" width="0.2032" layer="21"/>
<wire x1="4.50" y1="2.00" x2="-4.50" y2="2.00" width="0.2032" layer="21"/>
<wire x1="-4.50" y1="2.00" x2="-4.50" y2="-2.00" width="0.2032" layer="21"/>
<text x="-4.50" y="2.80" size="1.27" layer="25">&gt;NAME</text>
<text x="-4.50" y="-4.00" size="1.016" layer="27">&gt;VALUE</text>

<wire x1="2.8" y1="-1.8" x2="2.8" y2="1.8" width="0.4" layer="21"/>
<pad name="A" x="-5.08" y="0" drill="1.1" diameter="2.2" shape="square"/>
<pad name="K" x="5.08" y="0" drill="1.1" diameter="2.2"/>
</package>

<package name="ELCO_CAP">
<circle x="0" y="0" radius="4.5" width="0.2032" layer="21"/>
<text x="-4.0" y="5.2" size="1.27" layer="25">&gt;NAME</text>
<text x="-4.0" y="-6.8" size="1.016" layer="27">&gt;VALUE</text>
<pad name="+" x="-2.54" y="0" drill="0.9" diameter="1.9" shape="square"/>
<pad name="-" x="2.54" y="0" drill="0.9" diameter="1.9"/>
</package>

<package name="MYLAR_104">
<wire x1="-3.50" y1="-1.75" x2="3.50" y2="-1.75" width="0.2032" layer="21"/>
<wire x1="3.50" y1="-1.75" x2="3.50" y2="1.75" width="0.2032" layer="21"/>
<wire x1="3.50" y1="1.75" x2="-3.50" y2="1.75" width="0.2032" layer="21"/>
<wire x1="-3.50" y1="1.75" x2="-3.50" y2="-1.75" width="0.2032" layer="21"/>
<text x="-3.50" y="2.55" size="1.27" layer="25">&gt;NAME</text>
<text x="-3.50" y="-3.75" size="1.016" layer="27">&gt;VALUE</text>

<pad name="1" x="-2.54" y="0" drill="0.8" diameter="1.7"/>
<pad name="2" x="2.54" y="0" drill="0.8" diameter="1.7"/>
</package>

<package name="SWITCH_2P">
<wire x1="-5.00" y1="-3.00" x2="5.00" y2="-3.00" width="0.2032" layer="21"/>
<wire x1="5.00" y1="-3.00" x2="5.00" y2="3.00" width="0.2032" layer="21"/>
<wire x1="5.00" y1="3.00" x2="-5.00" y2="3.00" width="0.2032" layer="21"/>
<wire x1="-5.00" y1="3.00" x2="-5.00" y2="-3.00" width="0.2032" layer="21"/>
<text x="-5.00" y="3.80" size="1.27" layer="25">&gt;NAME</text>
<text x="-5.00" y="-5.00" size="1.016" layer="27">&gt;VALUE</text>

<pad name="1" x="-2.54" y="0" drill="1.3" diameter="2.4" shape="square"/>
<pad name="2" x="2.54" y="0" drill="1.3" diameter="2.4"/>
</package>

</packages>
<symbols>

<symbol name="TERM_2P"><wire x1="-6.35" y1="-5.08" x2="6.35" y2="-5.08" width="0.254" layer="94"/>
<wire x1="6.35" y1="-5.08" x2="6.35" y2="5.08" width="0.254" layer="94"/>
<wire x1="6.35" y1="5.08" x2="-6.35" y2="5.08" width="0.254" layer="94"/>
<wire x1="-6.35" y1="5.08" x2="-6.35" y2="-5.08" width="0.254" layer="94"/>
<text x="-6.35" y="6.35" size="1.778" layer="95">&gt;NAME</text>
<text x="-6.35" y="-7.62" size="1.524" layer="96">&gt;VALUE</text>
<pin name="1" x="-10.16" y="2.54" length="short" rot="R0"/>
<pin name="2" x="-10.16" y="-2.54" length="short" rot="R0"/>
</symbol>
<symbol name="TERM_3P"><wire x1="-6.35" y1="-6.35" x2="6.35" y2="-6.35" width="0.254" layer="94"/>
<wire x1="6.35" y1="-6.35" x2="6.35" y2="6.35" width="0.254" layer="94"/>
<wire x1="6.35" y1="6.35" x2="-6.35" y2="6.35" width="0.254" layer="94"/>
<wire x1="-6.35" y1="6.35" x2="-6.35" y2="-6.35" width="0.254" layer="94"/>
<text x="-6.35" y="7.62" size="1.778" layer="95">&gt;NAME</text>
<text x="-6.35" y="-8.89" size="1.524" layer="96">&gt;VALUE</text>
<pin name="1" x="-10.16" y="2.54" length="short" rot="R0"/>
<pin name="2" x="-10.16" y="0.00" length="short" rot="R0"/>
<pin name="3" x="-10.16" y="-2.54" length="short" rot="R0"/>
</symbol>
<symbol name="TERM_4P"><wire x1="-6.35" y1="-7.62" x2="6.35" y2="-7.62" width="0.254" layer="94"/>
<wire x1="6.35" y1="-7.62" x2="6.35" y2="7.62" width="0.254" layer="94"/>
<wire x1="6.35" y1="7.62" x2="-6.35" y2="7.62" width="0.254" layer="94"/>
<wire x1="-6.35" y1="7.62" x2="-6.35" y2="-7.62" width="0.254" layer="94"/>
<text x="-6.35" y="8.89" size="1.778" layer="95">&gt;NAME</text>
<text x="-6.35" y="-10.16" size="1.524" layer="96">&gt;VALUE</text>
<pin name="1" x="-10.16" y="5.08" length="short" rot="R0"/>
<pin name="2" x="-10.16" y="1.27" length="short" rot="R0"/>
<pin name="3" x="-10.16" y="-1.27" length="short" rot="R0"/>
<pin name="4" x="-10.16" y="-5.08" length="short" rot="R0"/>
</symbol>
<symbol name="TWO_PIN"><wire x1="-7.62" y1="-2.54" x2="7.62" y2="-2.54" width="0.254" layer="94"/>
<wire x1="7.62" y1="-2.54" x2="7.62" y2="2.54" width="0.254" layer="94"/>
<wire x1="7.62" y1="2.54" x2="-7.62" y2="2.54" width="0.254" layer="94"/>
<wire x1="-7.62" y1="2.54" x2="-7.62" y2="-2.54" width="0.254" layer="94"/>
<text x="-7.62" y="3.81" size="1.778" layer="95">&gt;NAME</text>
<text x="-7.62" y="-5.08" size="1.524" layer="96">&gt;VALUE</text>
<pin name="1" x="-10.16" y="0.00" length="short" rot="R0"/>
<pin name="2" x="10.16" y="0.00" length="short" rot="R180"/>
</symbol>
<symbol name="DIODE_2P"><wire x1="-7.62" y1="-2.54" x2="7.62" y2="-2.54" width="0.254" layer="94"/>
<wire x1="7.62" y1="-2.54" x2="7.62" y2="2.54" width="0.254" layer="94"/>
<wire x1="7.62" y1="2.54" x2="-7.62" y2="2.54" width="0.254" layer="94"/>
<wire x1="-7.62" y1="2.54" x2="-7.62" y2="-2.54" width="0.254" layer="94"/>
<text x="-7.62" y="3.81" size="1.778" layer="95">&gt;NAME</text>
<text x="-7.62" y="-5.08" size="1.524" layer="96">&gt;VALUE</text>
<pin name="A" x="-10.16" y="0.00" length="short" rot="R0"/>
<pin name="K" x="10.16" y="0.00" length="short" rot="R180"/>
</symbol>
<symbol name="CAP_POL"><wire x1="-6.35" y1="-5.08" x2="6.35" y2="-5.08" width="0.254" layer="94"/>
<wire x1="6.35" y1="-5.08" x2="6.35" y2="5.08" width="0.254" layer="94"/>
<wire x1="6.35" y1="5.08" x2="-6.35" y2="5.08" width="0.254" layer="94"/>
<wire x1="-6.35" y1="5.08" x2="-6.35" y2="-5.08" width="0.254" layer="94"/>
<text x="-6.35" y="6.35" size="1.778" layer="95">&gt;NAME</text>
<text x="-6.35" y="-7.62" size="1.524" layer="96">&gt;VALUE</text>
<pin name="+" x="-10.16" y="2.54" length="short" rot="R0"/>
<pin name="-" x="-10.16" y="-2.54" length="short" rot="R0"/>
</symbol>
<symbol name="NPN_S8050"><wire x1="-6.35" y1="-6.35" x2="6.35" y2="-6.35" width="0.254" layer="94"/>
<wire x1="6.35" y1="-6.35" x2="6.35" y2="6.35" width="0.254" layer="94"/>
<wire x1="6.35" y1="6.35" x2="-6.35" y2="6.35" width="0.254" layer="94"/>
<wire x1="-6.35" y1="6.35" x2="-6.35" y2="-6.35" width="0.254" layer="94"/>
<text x="-6.35" y="7.62" size="1.778" layer="95">&gt;NAME</text>
<text x="-6.35" y="-8.89" size="1.524" layer="96">&gt;VALUE</text>
<pin name="B" x="-10.16" y="0.00" length="short" rot="R0"/>
<pin name="C" x="0.00" y="10.16" length="short" rot="R270"/>
<pin name="E" x="0.00" y="-10.16" length="short" rot="R90"/>
</symbol>
<symbol name="INA226_MOD"><wire x1="-11.43" y1="-8.89" x2="11.43" y2="-8.89" width="0.254" layer="94"/>
<wire x1="11.43" y1="-8.89" x2="11.43" y2="8.89" width="0.254" layer="94"/>
<wire x1="11.43" y1="8.89" x2="-11.43" y2="8.89" width="0.254" layer="94"/>
<wire x1="-11.43" y1="8.89" x2="-11.43" y2="-8.89" width="0.254" layer="94"/>
<text x="-11.43" y="10.16" size="1.778" layer="95">&gt;NAME</text>
<text x="-11.43" y="-11.43" size="1.524" layer="96">&gt;VALUE</text>
<pin name="VIN+" x="-15.24" y="5.08" length="short" rot="R0"/>
<pin name="VIN-" x="-15.24" y="-5.08" length="short" rot="R0"/>
<pin name="VCC" x="15.24" y="5.08" length="short" rot="R180"/>
<pin name="GND" x="15.24" y="2.54" length="short" rot="R180"/>
<pin name="SCL" x="15.24" y="-2.54" length="short" rot="R180"/>
<pin name="SDA" x="15.24" y="-5.08" length="short" rot="R180"/>
</symbol>
<symbol name="CN3791_MOD"><wire x1="-11.43" y1="-7.62" x2="11.43" y2="-7.62" width="0.254" layer="94"/>
<wire x1="11.43" y1="-7.62" x2="11.43" y2="7.62" width="0.254" layer="94"/>
<wire x1="11.43" y1="7.62" x2="-11.43" y2="7.62" width="0.254" layer="94"/>
<wire x1="-11.43" y1="7.62" x2="-11.43" y2="-7.62" width="0.254" layer="94"/>
<text x="-11.43" y="8.89" size="1.778" layer="95">&gt;NAME</text>
<text x="-11.43" y="-10.16" size="1.524" layer="96">&gt;VALUE</text>
<pin name="IN+" x="-15.24" y="5.08" length="short" rot="R0"/>
<pin name="IN-" x="-15.24" y="-5.08" length="short" rot="R0"/>
<pin name="BAT+" x="15.24" y="5.08" length="short" rot="R180"/>
<pin name="BAT-" x="15.24" y="-5.08" length="short" rot="R180"/>
</symbol>
<symbol name="DCDC_5V_MOD"><wire x1="-11.43" y1="-7.62" x2="11.43" y2="-7.62" width="0.254" layer="94"/>
<wire x1="11.43" y1="-7.62" x2="11.43" y2="7.62" width="0.254" layer="94"/>
<wire x1="11.43" y1="7.62" x2="-11.43" y2="7.62" width="0.254" layer="94"/>
<wire x1="-11.43" y1="7.62" x2="-11.43" y2="-7.62" width="0.254" layer="94"/>
<text x="-11.43" y="8.89" size="1.778" layer="95">&gt;NAME</text>
<text x="-11.43" y="-10.16" size="1.524" layer="96">&gt;VALUE</text>
<pin name="IN+" x="-15.24" y="5.08" length="short" rot="R0"/>
<pin name="IN-" x="-15.24" y="-5.08" length="short" rot="R0"/>
<pin name="OUT+" x="15.24" y="5.08" length="short" rot="R180"/>
<pin name="OUT-" x="15.24" y="-5.08" length="short" rot="R180"/>
</symbol>
<symbol name="ESP32_S3_N16R8"><wire x1="-15.24" y1="-20.32" x2="15.24" y2="-20.32" width="0.254" layer="94"/>
<wire x1="15.24" y1="-20.32" x2="15.24" y2="20.32" width="0.254" layer="94"/>
<wire x1="15.24" y1="20.32" x2="-15.24" y2="20.32" width="0.254" layer="94"/>
<wire x1="-15.24" y1="20.32" x2="-15.24" y2="-20.32" width="0.254" layer="94"/>
<text x="-15.24" y="21.59" size="1.778" layer="95">&gt;NAME</text>
<text x="-15.24" y="-22.86" size="1.524" layer="96">&gt;VALUE</text>
<pin name="3V3" x="-20.32" y="12.70" length="short" rot="R0"/>
<pin name="5V" x="-20.32" y="7.62" length="short" rot="R0"/>
<pin name="GND" x="-20.32" y="2.54" length="short" rot="R0"/>
<pin name="GPIO8_SDA" x="-20.32" y="-5.08" length="short" rot="R0"/>
<pin name="GPIO9_SCL" x="-20.32" y="-10.16" length="short" rot="R0"/>
<pin name="GPIO4" x="20.32" y="12.70" length="short" rot="R180"/>
<pin name="GPIO5" x="20.32" y="7.62" length="short" rot="R180"/>
<pin name="GPIO6" x="20.32" y="2.54" length="short" rot="R180"/>
<pin name="GPIO7" x="20.32" y="-2.54" length="short" rot="R180"/>
<pin name="GPIO21_BUZ" x="20.32" y="-7.62" length="short" rot="R180"/>
<pin name="GPIO17_TX" x="20.32" y="-12.70" length="short" rot="R180"/>
<pin name="GPIO18_RX" x="20.32" y="-17.78" length="short" rot="R180"/>
</symbol>

</symbols>
<devicesets>
<deviceset name="TERM_2P" prefix="J">
<gates><gate name="G$1" symbol="TERM_2P" x="0" y="0"/></gates>
<devices><device name="" package="TERM_2P">
<connects>
<connect gate="G$1" pin="1" pad="1"/>
<connect gate="G$1" pin="2" pad="2"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="TERM_3P" prefix="J">
<gates><gate name="G$1" symbol="TERM_3P" x="0" y="0"/></gates>
<devices><device name="" package="TERM_3P">
<connects>
<connect gate="G$1" pin="1" pad="1"/>
<connect gate="G$1" pin="2" pad="2"/>
<connect gate="G$1" pin="3" pad="3"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="TERM_4P" prefix="J">
<gates><gate name="G$1" symbol="TERM_4P" x="0" y="0"/></gates>
<devices><device name="" package="TERM_4P">
<connects>
<connect gate="G$1" pin="1" pad="1"/>
<connect gate="G$1" pin="2" pad="2"/>
<connect gate="G$1" pin="3" pad="3"/>
<connect gate="G$1" pin="4" pad="4"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="FUSE_HOLDER" prefix="F">
<gates><gate name="G$1" symbol="TWO_PIN" x="0" y="0"/></gates>
<devices><device name="" package="FUSE_HOLDER">
<connects>
<connect gate="G$1" pin="1" pad="1"/>
<connect gate="G$1" pin="2" pad="2"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="SWITCH_2P" prefix="SW">
<gates><gate name="G$1" symbol="TWO_PIN" x="0" y="0"/></gates>
<devices><device name="" package="SWITCH_2P">
<connects>
<connect gate="G$1" pin="1" pad="1"/>
<connect gate="G$1" pin="2" pad="2"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="AXIAL_RES" prefix="R">
<gates><gate name="G$1" symbol="TWO_PIN" x="0" y="0"/></gates>
<devices><device name="" package="AXIAL_RES">
<connects>
<connect gate="G$1" pin="1" pad="1"/>
<connect gate="G$1" pin="2" pad="2"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="MYLAR_104" prefix="C">
<gates><gate name="G$1" symbol="TWO_PIN" x="0" y="0"/></gates>
<devices><device name="" package="MYLAR_104">
<connects>
<connect gate="G$1" pin="1" pad="1"/>
<connect gate="G$1" pin="2" pad="2"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="DIODE_SS34" prefix="D">
<gates><gate name="G$1" symbol="DIODE_2P" x="0" y="0"/></gates>
<devices><device name="" package="DIODE_SS34">
<connects>
<connect gate="G$1" pin="A" pad="A"/>
<connect gate="G$1" pin="K" pad="K"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="ELCO_CAP" prefix="C">
<gates><gate name="G$1" symbol="CAP_POL" x="0" y="0"/></gates>
<devices><device name="" package="ELCO_CAP">
<connects>
<connect gate="G$1" pin="+" pad="+"/>
<connect gate="G$1" pin="-" pad="-"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="BUZZER_5V" prefix="BZ">
<gates><gate name="G$1" symbol="CAP_POL" x="0" y="0"/></gates>
<devices><device name="" package="BUZZER_5V">
<connects>
<connect gate="G$1" pin="+" pad="+"/>
<connect gate="G$1" pin="-" pad="-"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="TO92_S8050" prefix="Q">
<gates><gate name="G$1" symbol="NPN_S8050" x="0" y="0"/></gates>
<devices><device name="" package="TO92_S8050">
<connects>
<connect gate="G$1" pin="E" pad="E"/>
<connect gate="G$1" pin="B" pad="B"/>
<connect gate="G$1" pin="C" pad="C"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="INA226_MOD" prefix="U">
<gates><gate name="G$1" symbol="INA226_MOD" x="0" y="0"/></gates>
<devices><device name="" package="INA226_MOD">
<connects>
<connect gate="G$1" pin="VIN+" pad="VIN+"/>
<connect gate="G$1" pin="VIN-" pad="VIN-"/>
<connect gate="G$1" pin="VCC" pad="VCC"/>
<connect gate="G$1" pin="GND" pad="GND"/>
<connect gate="G$1" pin="SCL" pad="SCL"/>
<connect gate="G$1" pin="SDA" pad="SDA"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="CN3791_MOD" prefix="U">
<gates><gate name="G$1" symbol="CN3791_MOD" x="0" y="0"/></gates>
<devices><device name="" package="CN3791_MOD">
<connects>
<connect gate="G$1" pin="IN+" pad="IN+"/>
<connect gate="G$1" pin="IN-" pad="IN-"/>
<connect gate="G$1" pin="BAT+" pad="BAT+"/>
<connect gate="G$1" pin="BAT-" pad="BAT-"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="DCDC_5V_MOD" prefix="U">
<gates><gate name="G$1" symbol="DCDC_5V_MOD" x="0" y="0"/></gates>
<devices><device name="" package="DCDC_5V_MOD">
<connects>
<connect gate="G$1" pin="IN+" pad="IN+"/>
<connect gate="G$1" pin="IN-" pad="IN-"/>
<connect gate="G$1" pin="OUT+" pad="OUT+"/>
<connect gate="G$1" pin="OUT-" pad="OUT-"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
<deviceset name="ESP32_S3_N16R8" prefix="U">
<gates><gate name="G$1" symbol="ESP32_S3_N16R8" x="0" y="0"/></gates>
<devices><device name="" package="ESP32_S3_N16R8">
<connects>
<connect gate="G$1" pin="3V3" pad="3V3"/>
<connect gate="G$1" pin="5V" pad="5V"/>
<connect gate="G$1" pin="GND" pad="GND"/>
<connect gate="G$1" pin="GPIO4" pad="GPIO4"/>
<connect gate="G$1" pin="GPIO5" pad="GPIO5"/>
<connect gate="G$1" pin="GPIO6" pad="GPIO6"/>
<connect gate="G$1" pin="GPIO7" pad="GPIO7"/>
<connect gate="G$1" pin="GPIO8_SDA" pad="GPIO8_SDA"/>
<connect gate="G$1" pin="GPIO9_SCL" pad="GPIO9_SCL"/>
<connect gate="G$1" pin="GPIO17_TX" pad="GPIO17_TX"/>
<connect gate="G$1" pin="GPIO18_RX" pad="GPIO18_RX"/>
<connect gate="G$1" pin="GPIO21_BUZ" pad="GPIO21_BUZ"/>
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>
</devicesets>
</library>
</libraries>
<attributes/>
<variantdefs/>
<classes>
<class number="0" name="default" width="0" drill="0"/>
</classes>
<parts>
<part name="J_PV" library="smart_soil_lib" deviceset="TERM_2P" device="" value="IN PANEL PV"/>
<part name="J_BATT" library="smart_soil_lib" deviceset="TERM_2P" device="" value="BATERAI"/>
<part name="J_OUT5V" library="smart_soil_lib" deviceset="TERM_2P" device="" value="OUT 5V ZTE MF90"/>
<part name="J_DS18B20" library="smart_soil_lib" deviceset="TERM_3P" device="" value="DS18B20"/>
<part name="J_CAP" library="smart_soil_lib" deviceset="TERM_3P" device="" value="CAP MOISTURE"/>
<part name="J_DMS" library="smart_soil_lib" deviceset="TERM_4P" device="" value="MODUL DMS (3V3/G6/G7/GND)"/>
<part name="J_PH_GND" library="smart_soil_lib" deviceset="TERM_2P" device="" value="pH PUTIH->GND"/>
<part name="F1_BATT" library="smart_soil_lib" deviceset="FUSE_HOLDER" device="" value="5A"/>
<part name="F2_5V" library="smart_soil_lib" deviceset="FUSE_HOLDER" device="" value="3A"/>
<part name="F3_PV" library="smart_soil_lib" deviceset="FUSE_HOLDER" device="" value="2A"/>
<part name="U_INA_PV" library="smart_soil_lib" deviceset="INA226_MOD" device="" value="INA226 #1 0x40"/>
<part name="U_INA_BATT" library="smart_soil_lib" deviceset="INA226_MOD" device="" value="INA226 #2 0x41"/>
<part name="U_CN3791" library="smart_soil_lib" deviceset="CN3791_MOD" device="" value="CN3791 MPPT"/>
<part name="U_DCDC5V" library="smart_soil_lib" deviceset="DCDC_5V_MOD" device="" value="DC-DC 5V 3A"/>
<part name="U_ESP32" library="smart_soil_lib" deviceset="ESP32_S3_N16R8" device="" value="ESP32-S3 N16R8"/>
<part name="BZ1" library="smart_soil_lib" deviceset="BUZZER_5V" device="" value="ACTIVE 5V"/>
<part name="Q1" library="smart_soil_lib" deviceset="TO92_S8050" device="" value="S8050 D 518"/>
<part name="R_BUZ" library="smart_soil_lib" deviceset="AXIAL_RES" device="" value="1k"/>
<part name="SW1" library="smart_soil_lib" deviceset="SWITCH_2P" device="" value="ON/OFF"/>
<part name="D_PV" library="smart_soil_lib" deviceset="DIODE_SS34" device="" value="SS34 3A"/>
<part name="C_ELCO1" library="smart_soil_lib" deviceset="ELCO_CAP" device="" value="1000uF 16V"/>
<part name="C_ELCO2" library="smart_soil_lib" deviceset="ELCO_CAP" device="" value="470uF 16V"/>
<part name="C_104_A" library="smart_soil_lib" deviceset="MYLAR_104" device="" value="2A104J 100nF"/>
<part name="C_104_B" library="smart_soil_lib" deviceset="MYLAR_104" device="" value="2A104J 100nF"/>
<part name="R_DS18" library="smart_soil_lib" deviceset="AXIAL_RES" device="" value="4.7k"/>
</parts>
<sheets>
<sheet>
<plain>
<wire x1="0" y1="0" x2="297" y2="0" width="0.4064" layer="94"/>
<wire x1="297" y1="0" x2="297" y2="250" width="0.4064" layer="94"/>
<wire x1="297" y1="250" x2="0" y2="250" width="0.4064" layer="94"/>
<wire x1="0" y1="250" x2="0" y2="0" width="0.4064" layer="94"/>
<text x="10.16" y="238.76" size="3.81" layer="94">SMART SOIL MONITORING IoT — ESP32-S3 N16R8 + 2x INA226 + CN3791 + ZTE MF90</text>
</plain>
<instances>
<instance part="J_PV" gate="G$1" x="25.40" y="215.90"/>
<instance part="J_BATT" gate="G$1" x="25.40" y="177.80"/>
<instance part="J_OUT5V" gate="G$1" x="25.40" y="139.70"/>
<instance part="J_DS18B20" gate="G$1" x="241.30" y="215.90"/>
<instance part="J_CAP" gate="G$1" x="241.30" y="182.88"/>
<instance part="J_DMS" gate="G$1" x="241.30" y="142.24"/>
<instance part="J_PH_GND" gate="G$1" x="241.30" y="106.68"/>
<instance part="F1_BATT" gate="G$1" x="60.96" y="177.80"/>
<instance part="F2_5V" gate="G$1" x="60.96" y="139.70"/>
<instance part="F3_PV" gate="G$1" x="60.96" y="215.90"/>
<instance part="U_INA_PV" gate="G$1" x="121.92" y="215.90"/>
<instance part="U_INA_BATT" gate="G$1" x="121.92" y="177.80"/>
<instance part="U_CN3791" gate="G$1" x="162.56" y="215.90"/>
<instance part="U_DCDC5V" gate="G$1" x="121.92" y="139.70"/>
<instance part="U_ESP32" gate="G$1" x="185.42" y="154.94"/>
<instance part="BZ1" gate="G$1" x="241.30" y="76.20"/>
<instance part="Q1" gate="G$1" x="220.98" y="60.96"/>
<instance part="R_BUZ" gate="G$1" x="200.66" y="60.96"/>
<instance part="SW1" gate="G$1" x="91.44" y="177.80"/>
<instance part="D_PV" gate="G$1" x="91.44" y="215.90"/>
<instance part="C_ELCO1" gate="G$1" x="147.32" y="139.70"/>
<instance part="C_ELCO2" gate="G$1" x="157.48" y="139.70"/>
<instance part="C_104_A" gate="G$1" x="167.64" y="139.70"/>
<instance part="C_104_B" gate="G$1" x="218.44" y="182.88"/>
<instance part="R_DS18" gate="G$1" x="218.44" y="215.90"/>
</instances>
<busses/>
<nets>
<net name="PV_RAW" class="0">
<segment>
<pinref part="J_PV" gate="G$1" pin="1"/>
<pinref part="F3_PV" gate="G$1" pin="1"/>
<wire x1="25.40" y1="215.90" x2="27.94" y2="215.90" width="0.1524" layer="91"/>
<label x="27.94" y="215.90" size="1.27" layer="95"/>
</segment>
</net>
<net name="PV_FUSED" class="0">
<segment>
<pinref part="F3_PV" gate="G$1" pin="2"/>
<pinref part="D_PV" gate="G$1" pin="A"/>
<wire x1="60.96" y1="215.90" x2="63.50" y2="215.90" width="0.1524" layer="91"/>
<label x="63.50" y="215.90" size="1.27" layer="95"/>
</segment>
</net>
<net name="PV_PROTECT" class="0">
<segment>
<pinref part="D_PV" gate="G$1" pin="K"/>
<pinref part="U_INA_PV" gate="G$1" pin="VIN+"/>
<wire x1="91.44" y1="215.90" x2="93.98" y2="215.90" width="0.1524" layer="91"/>
<label x="93.98" y="215.90" size="1.27" layer="95"/>
</segment>
</net>
<net name="PV_TO_CN" class="0">
<segment>
<pinref part="U_INA_PV" gate="G$1" pin="VIN-"/>
<pinref part="U_CN3791" gate="G$1" pin="IN+"/>
<wire x1="121.92" y1="215.90" x2="124.46" y2="215.90" width="0.1524" layer="91"/>
<label x="124.46" y="215.90" size="1.27" layer="95"/>
</segment>
</net>
<net name="BATT_RAW" class="0">
<segment>
<pinref part="J_BATT" gate="G$1" pin="1"/>
<pinref part="F1_BATT" gate="G$1" pin="1"/>
<wire x1="25.40" y1="177.80" x2="27.94" y2="177.80" width="0.1524" layer="91"/>
<label x="27.94" y="177.80" size="1.27" layer="95"/>
</segment>
</net>
<net name="BATT_FUSED" class="0">
<segment>
<pinref part="F1_BATT" gate="G$1" pin="2"/>
<pinref part="SW1" gate="G$1" pin="1"/>
<wire x1="60.96" y1="177.80" x2="63.50" y2="177.80" width="0.1524" layer="91"/>
<label x="63.50" y="177.80" size="1.27" layer="95"/>
</segment>
</net>
<net name="BATT_SW" class="0">
<segment>
<pinref part="SW1" gate="G$1" pin="2"/>
<pinref part="U_INA_BATT" gate="G$1" pin="VIN-"/>
<pinref part="U_DCDC5V" gate="G$1" pin="IN+"/>
<wire x1="91.44" y1="177.80" x2="93.98" y2="177.80" width="0.1524" layer="91"/>
<label x="93.98" y="177.80" size="1.27" layer="95"/>
</segment>
</net>
<net name="CN_TO_INA2" class="0">
<segment>
<pinref part="U_CN3791" gate="G$1" pin="BAT+"/>
<pinref part="U_INA_BATT" gate="G$1" pin="VIN+"/>
<wire x1="162.56" y1="215.90" x2="165.10" y2="215.90" width="0.1524" layer="91"/>
<label x="165.10" y="215.90" size="1.27" layer="95"/>
</segment>
</net>
<net name="5V_RAW" class="0">
<segment>
<pinref part="U_DCDC5V" gate="G$1" pin="OUT+"/>
<pinref part="F2_5V" gate="G$1" pin="1"/>
<wire x1="121.92" y1="139.70" x2="124.46" y2="139.70" width="0.1524" layer="91"/>
<label x="124.46" y="139.70" size="1.27" layer="95"/>
</segment>
</net>
<net name="5V_BUS" class="0">
<segment>
<pinref part="F2_5V" gate="G$1" pin="2"/>
<pinref part="J_OUT5V" gate="G$1" pin="1"/>
<pinref part="U_ESP32" gate="G$1" pin="5V"/>
<pinref part="BZ1" gate="G$1" pin="+"/>
<pinref part="C_ELCO1" gate="G$1" pin="+"/>
<pinref part="C_ELCO2" gate="G$1" pin="+"/>
<pinref part="C_104_A" gate="G$1" pin="1"/>
<wire x1="60.96" y1="139.70" x2="63.50" y2="139.70" width="0.1524" layer="91"/>
<label x="63.50" y="139.70" size="1.27" layer="95"/>
</segment>
</net>
<net name="3V3_BUS" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="3V3"/>
<pinref part="U_INA_PV" gate="G$1" pin="VCC"/>
<pinref part="U_INA_BATT" gate="G$1" pin="VCC"/>
<pinref part="J_DS18B20" gate="G$1" pin="1"/>
<pinref part="J_CAP" gate="G$1" pin="1"/>
<pinref part="J_DMS" gate="G$1" pin="1"/>
<pinref part="R_DS18" gate="G$1" pin="1"/>
<pinref part="C_104_B" gate="G$1" pin="1"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="GND" class="0">
<segment>
<pinref part="J_PV" gate="G$1" pin="2"/>
<pinref part="J_BATT" gate="G$1" pin="2"/>
<pinref part="J_OUT5V" gate="G$1" pin="2"/>
<pinref part="J_DS18B20" gate="G$1" pin="3"/>
<pinref part="J_CAP" gate="G$1" pin="3"/>
<pinref part="J_DMS" gate="G$1" pin="4"/>
<pinref part="J_PH_GND" gate="G$1" pin="1"/>
<pinref part="J_PH_GND" gate="G$1" pin="2"/>
<pinref part="U_CN3791" gate="G$1" pin="IN-"/>
<pinref part="U_CN3791" gate="G$1" pin="BAT-"/>
<pinref part="U_DCDC5V" gate="G$1" pin="IN-"/>
<pinref part="U_DCDC5V" gate="G$1" pin="OUT-"/>
<pinref part="U_INA_PV" gate="G$1" pin="GND"/>
<pinref part="U_INA_BATT" gate="G$1" pin="GND"/>
<pinref part="U_ESP32" gate="G$1" pin="GND"/>
<pinref part="C_ELCO1" gate="G$1" pin="-"/>
<pinref part="C_ELCO2" gate="G$1" pin="-"/>
<pinref part="C_104_A" gate="G$1" pin="2"/>
<pinref part="C_104_B" gate="G$1" pin="2"/>
<pinref part="Q1" gate="G$1" pin="E"/>
<wire x1="25.40" y1="215.90" x2="27.94" y2="215.90" width="0.1524" layer="91"/>
<label x="27.94" y="215.90" size="1.27" layer="95"/>
</segment>
</net>
<net name="I2C_SDA" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="GPIO8_SDA"/>
<pinref part="U_INA_PV" gate="G$1" pin="SDA"/>
<pinref part="U_INA_BATT" gate="G$1" pin="SDA"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="I2C_SCL" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="GPIO9_SCL"/>
<pinref part="U_INA_PV" gate="G$1" pin="SCL"/>
<pinref part="U_INA_BATT" gate="G$1" pin="SCL"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="SIG_DS18" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="GPIO4"/>
<pinref part="J_DS18B20" gate="G$1" pin="2"/>
<pinref part="R_DS18" gate="G$1" pin="2"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="SIG_CAP" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="GPIO5"/>
<pinref part="J_CAP" gate="G$1" pin="2"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="SIG_PH_DMS" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="GPIO6"/>
<pinref part="J_DMS" gate="G$1" pin="2"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="SIG_DMS_D" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="GPIO7"/>
<pinref part="J_DMS" gate="G$1" pin="3"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="BUZ_SIG" class="0">
<segment>
<pinref part="U_ESP32" gate="G$1" pin="GPIO21_BUZ"/>
<pinref part="R_BUZ" gate="G$1" pin="1"/>
<wire x1="185.42" y1="154.94" x2="187.96" y2="154.94" width="0.1524" layer="91"/>
<label x="187.96" y="154.94" size="1.27" layer="95"/>
</segment>
</net>
<net name="BUZ_BASE" class="0">
<segment>
<pinref part="R_BUZ" gate="G$1" pin="2"/>
<pinref part="Q1" gate="G$1" pin="B"/>
<wire x1="200.66" y1="60.96" x2="203.20" y2="60.96" width="0.1524" layer="91"/>
<label x="203.20" y="60.96" size="1.27" layer="95"/>
</segment>
</net>
<net name="BUZ_SINK" class="0">
<segment>
<pinref part="Q1" gate="G$1" pin="C"/>
<pinref part="BZ1" gate="G$1" pin="-"/>
<wire x1="220.98" y1="60.96" x2="223.52" y2="60.96" width="0.1524" layer="91"/>
<label x="223.52" y="60.96" size="1.27" layer="95"/>
</segment>
</net>
</nets>
</sheet>
</sheets>
</schematic>
</drawing>
</eagle>
