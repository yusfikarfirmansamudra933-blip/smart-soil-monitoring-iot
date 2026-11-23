import os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smart_soil_iot")
os.makedirs(OUT_DIR, exist_ok=True)

SCH_PATH = os.path.join(OUT_DIR, "smart_soil_iot.sch")
BRD_PATH = os.path.join(OUT_DIR, "smart_soil_iot.brd")

LAYERS_COMMON = """<layers>
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
</layers>"""

# ============================================================================
# SELF-CONTAINED PORTABLE EAGLE LIBRARY ("smart_soil_lib")
# ============================================================================
def pkg_rect(w, h, layer=21):
    hw, hh = w / 2.0, h / 2.0
    return (
        f'<wire x1="{-hw:.2f}" y1="{-hh:.2f}" x2="{hw:.2f}" y2="{-hh:.2f}" width="0.2032" layer="{layer}"/>\n'
        f'<wire x1="{hw:.2f}" y1="{-hh:.2f}" x2="{hw:.2f}" y2="{hh:.2f}" width="0.2032" layer="{layer}"/>\n'
        f'<wire x1="{hw:.2f}" y1="{hh:.2f}" x2="{-hw:.2f}" y2="{hh:.2f}" width="0.2032" layer="{layer}"/>\n'
        f'<wire x1="{-hw:.2f}" y1="{hh:.2f}" x2="{-hw:.2f}" y2="{-hh:.2f}" width="0.2032" layer="{layer}"/>\n'
        f'<text x="{-hw:.2f}" y="{hh + 0.8:.2f}" size="1.27" layer="25">&gt;NAME</text>\n'
        f'<text x="{-hw:.2f}" y="{-hh - 2.0:.2f}" size="1.016" layer="27">&gt;VALUE</text>\n'
    )

def sym_box(pins, w=20.32, h=15.24):
    # pins: list of (name, x, y, rot)
    hw, hh = w / 2.0, h / 2.0
    s = (
        f'<wire x1="{-hw:.2f}" y1="{-hh:.2f}" x2="{hw:.2f}" y2="{-hh:.2f}" width="0.254" layer="94"/>\n'
        f'<wire x1="{hw:.2f}" y1="{-hh:.2f}" x2="{hw:.2f}" y2="{hh:.2f}" width="0.254" layer="94"/>\n'
        f'<wire x1="{hw:.2f}" y1="{hh:.2f}" x2="{-hw:.2f}" y2="{hh:.2f}" width="0.254" layer="94"/>\n'
        f'<wire x1="{-hw:.2f}" y1="{hh:.2f}" x2="{-hw:.2f}" y2="{-hh:.2f}" width="0.254" layer="94"/>\n'
        f'<text x="{-hw:.2f}" y="{hh + 1.27:.2f}" size="1.778" layer="95">&gt;NAME</text>\n'
        f'<text x="{-hw:.2f}" y="{-hh - 2.54:.2f}" size="1.524" layer="96">&gt;VALUE</text>\n'
    )
    for pname, px, py, prot in pins:
        s += f'<pin name="{pname}" x="{px:.2f}" y="{py:.2f}" length="short" rot="{prot}"/>\n'
    return s

# Packages
PACKAGES_XML = f"""
<package name="TERM_2P">
{pkg_rect(11.0, 8.5)}
<pad name="1" x="-2.54" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="2.54" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="TERM_3P">
{pkg_rect(16.0, 8.5)}
<pad name="1" x="-5.08" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="0" y="0" drill="1.3" diameter="2.54"/>
<pad name="3" x="5.08" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="TERM_4P">
{pkg_rect(21.0, 8.5)}
<pad name="1" x="-7.62" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="-2.54" y="0" drill="1.3" diameter="2.54"/>
<pad name="3" x="2.54" y="0" drill="1.3" diameter="2.54"/>
<pad name="4" x="7.62" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="FUSE_HOLDER">
{pkg_rect(18.0, 7.5)}
<pad name="1" x="-7.62" y="0" drill="1.3" diameter="2.54" shape="square"/>
<pad name="2" x="7.62" y="0" drill="1.3" diameter="2.54"/>
</package>

<package name="INA226_MOD">
{pkg_rect(26.0, 16.0)}
<pad name="VIN+" x="-10.16" y="5.08" drill="1.2" diameter="2.2" shape="square"/>
<pad name="VIN-" x="-10.16" y="-5.08" drill="1.2" diameter="2.2"/>
<pad name="VCC" x="10.16" y="5.08" drill="1.0" diameter="1.9"/>
<pad name="GND" x="10.16" y="2.54" drill="1.0" diameter="1.9"/>
<pad name="SCL" x="10.16" y="-2.54" drill="1.0" diameter="1.9"/>
<pad name="SDA" x="10.16" y="-5.08" drill="1.0" diameter="1.9"/>
</package>

<package name="CN3791_MOD">
{pkg_rect(28.0, 19.0)}
<pad name="IN+" x="-11.43" y="5.08" drill="1.3" diameter="2.4" shape="square"/>
<pad name="IN-" x="-11.43" y="-5.08" drill="1.3" diameter="2.4"/>
<pad name="BAT+" x="11.43" y="5.08" drill="1.3" diameter="2.4"/>
<pad name="BAT-" x="11.43" y="-5.08" drill="1.3" diameter="2.4"/>
</package>

<package name="DCDC_5V_MOD">
{pkg_rect(28.0, 19.0)}
<pad name="IN+" x="-11.43" y="5.08" drill="1.3" diameter="2.4" shape="square"/>
<pad name="IN-" x="-11.43" y="-5.08" drill="1.3" diameter="2.4"/>
<pad name="OUT+" x="11.43" y="5.08" drill="1.3" diameter="2.4"/>
<pad name="OUT-" x="11.43" y="-5.08" drill="1.3" diameter="2.4"/>
</package>

<package name="ESP32_S3_N16R8">
{pkg_rect(56.0, 28.0)}
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
{pkg_rect(5.5, 4.5)}
<pad name="E" x="-2.54" y="0" drill="0.8" diameter="1.6" shape="square"/>
<pad name="B" x="0" y="0" drill="0.8" diameter="1.6"/>
<pad name="C" x="2.54" y="0" drill="0.8" diameter="1.6"/>
</package>

<package name="AXIAL_RES">
{pkg_rect(8.0, 2.8)}
<pad name="1" x="-5.08" y="0" drill="0.8" diameter="1.6"/>
<pad name="2" x="5.08" y="0" drill="0.8" diameter="1.6"/>
</package>

<package name="DIODE_SS34">
{pkg_rect(9.0, 4.0)}
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
{pkg_rect(7.0, 3.5)}
<pad name="1" x="-2.54" y="0" drill="0.8" diameter="1.7"/>
<pad name="2" x="2.54" y="0" drill="0.8" diameter="1.7"/>
</package>

<package name="SWITCH_2P">
{pkg_rect(10.0, 6.0)}
<pad name="1" x="-2.54" y="0" drill="1.3" diameter="2.4" shape="square"/>
<pad name="2" x="2.54" y="0" drill="1.3" diameter="2.4"/>
</package>
"""

SYMBOLS_XML = f"""
<symbol name="TERM_2P">{sym_box([("1", -10.16, 2.54, "R0"), ("2", -10.16, -2.54, "R0")], 12.7, 10.16)}</symbol>
<symbol name="TERM_3P">{sym_box([("1", -10.16, 2.54, "R0"), ("2", -10.16, 0, "R0"), ("3", -10.16, -2.54, "R0")], 12.7, 12.7)}</symbol>
<symbol name="TERM_4P">{sym_box([("1", -10.16, 5.08, "R0"), ("2", -10.16, 1.27, "R0"), ("3", -10.16, -1.27, "R0"), ("4", -10.16, -5.08, "R0")], 12.7, 15.24)}</symbol>
<symbol name="TWO_PIN">{sym_box([("1", -10.16, 0, "R0"), ("2", 10.16, 0, "R180")], 15.24, 5.08)}</symbol>
<symbol name="DIODE_2P">{sym_box([("A", -10.16, 0, "R0"), ("K", 10.16, 0, "R180")], 15.24, 5.08)}</symbol>
<symbol name="CAP_POL">{sym_box([("+", -10.16, 2.54, "R0"), ("-", -10.16, -2.54, "R0")], 12.7, 10.16)}</symbol>
<symbol name="NPN_S8050">{sym_box([("B", -10.16, 0, "R0"), ("C", 0, 10.16, "R270"), ("E", 0, -10.16, "R90")], 12.7, 12.7)}</symbol>
<symbol name="INA226_MOD">{sym_box([("VIN+", -15.24, 5.08, "R0"), ("VIN-", -15.24, -5.08, "R0"), ("VCC", 15.24, 5.08, "R180"), ("GND", 15.24, 2.54, "R180"), ("SCL", 15.24, -2.54, "R180"), ("SDA", 15.24, -5.08, "R180")], 22.86, 17.78)}</symbol>
<symbol name="CN3791_MOD">{sym_box([("IN+", -15.24, 5.08, "R0"), ("IN-", -15.24, -5.08, "R0"), ("BAT+", 15.24, 5.08, "R180"), ("BAT-", 15.24, -5.08, "R180")], 22.86, 15.24)}</symbol>
<symbol name="DCDC_5V_MOD">{sym_box([("IN+", -15.24, 5.08, "R0"), ("IN-", -15.24, -5.08, "R0"), ("OUT+", 15.24, 5.08, "R180"), ("OUT-", 15.24, -5.08, "R180")], 22.86, 15.24)}</symbol>
<symbol name="ESP32_S3_N16R8">{sym_box([
    ("3V3", -20.32, 12.7, "R0"), ("5V", -20.32, 7.62, "R0"), ("GND", -20.32, 2.54, "R0"),
    ("GPIO8_SDA", -20.32, -5.08, "R0"), ("GPIO9_SCL", -20.32, -10.16, "R0"),
    ("GPIO4", 20.32, 12.7, "R180"), ("GPIO5", 20.32, 7.62, "R180"), ("GPIO6", 20.32, 2.54, "R180"),
    ("GPIO7", 20.32, -2.54, "R180"), ("GPIO21_BUZ", 20.32, -7.62, "R180"),
    ("GPIO17_TX", 20.32, -12.7, "R180"), ("GPIO18_RX", 20.32, -17.78, "R180")
], 30.48, 40.64)}</symbol>
"""

def devset(name, pkg, sym, conns, prefix="U"):
    c_xml = "\n".join(f'<connect gate="G$1" pin="{pin}" pad="{pad}"/>' for pin, pad in conns)
    return f"""<deviceset name="{name}" prefix="{prefix}">
<gates><gate name="G$1" symbol="{sym}" x="0" y="0"/></gates>
<devices><device name="" package="{pkg}">
<connects>
{c_xml}
</connects>
<technologies><technology name=""/></technologies>
</device></devices>
</deviceset>"""

DEVICESETS_XML = "\n".join([
    devset("TERM_2P", "TERM_2P", "TERM_2P", [("1", "1"), ("2", "2")], "J"),
    devset("TERM_3P", "TERM_3P", "TERM_3P", [("1", "1"), ("2", "2"), ("3", "3")], "J"),
    devset("TERM_4P", "TERM_4P", "TERM_4P", [("1", "1"), ("2", "2"), ("3", "3"), ("4", "4")], "J"),
    devset("FUSE_HOLDER", "FUSE_HOLDER", "TWO_PIN", [("1", "1"), ("2", "2")], "F"),
    devset("SWITCH_2P", "SWITCH_2P", "TWO_PIN", [("1", "1"), ("2", "2")], "SW"),
    devset("AXIAL_RES", "AXIAL_RES", "TWO_PIN", [("1", "1"), ("2", "2")], "R"),
    devset("MYLAR_104", "MYLAR_104", "TWO_PIN", [("1", "1"), ("2", "2")], "C"),
    devset("DIODE_SS34", "DIODE_SS34", "DIODE_2P", [("A", "A"), ("K", "K")], "D"),
    devset("ELCO_CAP", "ELCO_CAP", "CAP_POL", [("+", "+"), ("-", "-")], "C"),
    devset("BUZZER_5V", "BUZZER_5V", "CAP_POL", [("+", "+"), ("-", "-")], "BZ"),
    devset("TO92_S8050", "TO92_S8050", "NPN_S8050", [("E", "E"), ("B", "B"), ("C", "C")], "Q"),
    devset("INA226_MOD", "INA226_MOD", "INA226_MOD", [("VIN+", "VIN+"), ("VIN-", "VIN-"), ("VCC", "VCC"), ("GND", "GND"), ("SCL", "SCL"), ("SDA", "SDA")], "U"),
    devset("CN3791_MOD", "CN3791_MOD", "CN3791_MOD", [("IN+", "IN+"), ("IN-", "IN-"), ("BAT+", "BAT+"), ("BAT-", "BAT-")], "U"),
    devset("DCDC_5V_MOD", "DCDC_5V_MOD", "DCDC_5V_MOD", [("IN+", "IN+"), ("IN-", "IN-"), ("OUT+", "OUT+"), ("OUT-", "OUT-")], "U"),
    devset("ESP32_S3_N16R8", "ESP32_S3_N16R8", "ESP32_S3_N16R8", [
        ("3V3", "3V3"), ("5V", "5V"), ("GND", "GND"), ("GPIO4", "GPIO4"), ("GPIO5", "GPIO5"),
        ("GPIO6", "GPIO6"), ("GPIO7", "GPIO7"), ("GPIO8_SDA", "GPIO8_SDA"), ("GPIO9_SCL", "GPIO9_SCL"),
        ("GPIO17_TX", "GPIO17_TX"), ("GPIO18_RX", "GPIO18_RX"), ("GPIO21_BUZ", "GPIO21_BUZ")
    ], "U"),
])

# ============================================================================
# PARTS LIST (Matching Schematic & 150x90mm Board!)
# ============================================================================
# (part_name, deviceset, value, sch_x, sch_y, brd_x, brd_y, brd_rot)
PARTS = [
    # 7 Bottom Terminals (Sejajar di bawah: y = 10.0 mm across x = 13 .. 137 mm)
    ("J_PV",       "TERM_2P",     "IN PANEL PV",     25.4, 215.9,  12.0, 10.0, "R0"),
    ("J_BATT",     "TERM_2P",     "BATERAI",         25.4, 177.8,  30.0, 10.0, "R0"),
    ("J_OUT5V",    "TERM_2P",     "OUT 5V ZTE MF90", 25.4, 139.7,  48.0, 10.0, "R0"),
    ("J_DS18B20",  "TERM_3P",     "DS18B20",        241.3, 215.9,  69.0, 10.0, "R0"),
    ("J_CAP",      "TERM_3P",     "CAP MOISTURE",   241.3, 182.88, 92.0, 10.0, "R0"),
    ("J_DMS",      "TERM_4P",     "MODUL DMS (3V3/G6/G7/GND)", 241.3, 142.24, 117.0, 10.0, "R0"),
    ("J_PH_GND",   "TERM_2P",     "pH PUTIH->GND",  241.3, 106.68, 139.0, 10.0, "R0"),

    # 3 Fuses sejajar di kiri atas (y = 79.0 mm)
    ("F1_BATT",    "FUSE_HOLDER", "5A",              60.96, 177.8,  14.0, 79.0, "R0"),
    ("F2_5V",      "FUSE_HOLDER", "3A",              60.96, 139.7,  34.5, 79.0, "R0"),
    ("F3_PV",      "FUSE_HOLDER", "2A",              60.96, 215.9,  55.0, 79.0, "R0"),

    # 2x INA226 sejajar di kiri tengah (y = 60.0 mm)
    ("U_INA_PV",   "INA226_MOD",  "INA226 #1 0x40", 121.92, 215.9,  18.0, 60.0, "R0"),
    ("U_INA_BATT", "INA226_MOD",  "INA226 #2 0x41", 121.92, 177.8,  48.0, 60.0, "R0"),

    # CN3791 & DC-DC 5V sejajar di bawah INA226 (y = 35.0 mm)
    ("U_CN3791",   "CN3791_MOD",  "CN3791 MPPT",    162.56, 215.9,  18.0, 35.0, "R0"),
    ("U_DCDC5V",   "DCDC_5V_MOD", "DC-DC 5V 3A",    121.92, 139.7,  48.0, 35.0, "R0"),

    # ESP32-S3 N16R8 horizontal di kanan atas (x = 99.0, y = 69.0 mm, leaving x > 128mm clear for WiFi antenna!)
    ("U_ESP32",    "ESP32_S3_N16R8", "ESP32-S3 N16R8", 185.42, 154.94, 99.0, 69.0, "R0"),

    # Active Buzzer 5V + S8050 + R1k + Switch + Passives di kanan tengah (y = 33..46 mm)
    ("BZ1",        "BUZZER_5V",   "ACTIVE 5V",      241.3,  76.2,   79.0, 40.0, "R0"),
    ("Q1",         "TO92_S8050",  "S8050 D 518",    220.98, 60.96,  94.0, 40.0, "R0"),
    ("R_BUZ",      "AXIAL_RES",   "1k",             200.66, 60.96,  94.0, 30.0, "R0"),
    ("SW1",        "SWITCH_2P",   "ON/OFF",          91.44, 177.8,  109.0, 40.0, "R0"),

    # Dioda Schottky, Elco, Mylar 2A104J, Resistor Pullup & Divider
    ("D_PV",       "DIODE_SS34",  "SS34 3A",         91.44, 215.9,  64.0, 49.0, "R90"),
    ("C_ELCO1",    "ELCO_CAP",    "1000uF 16V",     147.32, 139.7,  64.0, 24.0, "R0"),
    ("C_ELCO2",    "ELCO_CAP",    "470uF 16V",      157.48, 139.7,  122.0, 44.0, "R0"),
    ("C_104_A",    "MYLAR_104",   "2A104J 100nF",   167.64, 139.7,  122.0, 34.0, "R0"),
    ("C_104_B",    "MYLAR_104",   "2A104J 100nF",   218.44, 182.88, 122.0, 25.0, "R0"),
    ("R_DS18",     "AXIAL_RES",   "4.7k",           218.44, 215.9,  136.0, 44.0, "R0"),
]

# Nets: net_name -> list of (part, pad_or_pin)
NETS = {
    "PV_RAW":     [("J_PV", "1"), ("F3_PV", "1")],
    "PV_FUSED":   [("F3_PV", "2"), ("D_PV", "A")],
    "PV_PROTECT": [("D_PV", "K"), ("U_INA_PV", "VIN+")],
    "PV_TO_CN":   [("U_INA_PV", "VIN-"), ("U_CN3791", "IN+")],

    "BATT_RAW":   [("J_BATT", "1"), ("F1_BATT", "1")],
    "BATT_FUSED": [("F1_BATT", "2"), ("SW1", "1")],
    "BATT_SW":    [("SW1", "2"), ("U_INA_BATT", "VIN-"), ("U_DCDC5V", "IN+")],
    "CN_TO_INA2": [("U_CN3791", "BAT+"), ("U_INA_BATT", "VIN+")],

    "5V_RAW":     [("U_DCDC5V", "OUT+"), ("F2_5V", "1")],
    "5V_BUS":     [
        ("F2_5V", "2"), ("J_OUT5V", "1"), ("U_ESP32", "5V"),
        ("BZ1", "+"), ("C_ELCO1", "+"), ("C_ELCO2", "+"), ("C_104_A", "1")
    ],

    "3V3_BUS":    [
        ("U_ESP32", "3V3"), ("U_INA_PV", "VCC"), ("U_INA_BATT", "VCC"),
        ("J_DS18B20", "1"), ("J_CAP", "1"), ("J_DMS", "1"),
        ("R_DS18", "1"), ("C_104_B", "1")
    ],

    "GND":        [
        ("J_PV", "2"), ("J_BATT", "2"), ("J_OUT5V", "2"),
        ("J_DS18B20", "3"), ("J_CAP", "3"), ("J_DMS", "4"), ("J_PH_GND", "1"), ("J_PH_GND", "2"),
        ("U_CN3791", "IN-"), ("U_CN3791", "BAT-"), ("U_DCDC5V", "IN-"), ("U_DCDC5V", "OUT-"),
        ("U_INA_PV", "GND"), ("U_INA_BATT", "GND"), ("U_ESP32", "GND"),
        ("C_ELCO1", "-"), ("C_ELCO2", "-"), ("C_104_A", "2"), ("C_104_B", "2"),
        ("Q1", "E")
    ],

    "I2C_SDA":    [("U_ESP32", "GPIO8_SDA"), ("U_INA_PV", "SDA"), ("U_INA_BATT", "SDA")],
    "I2C_SCL":    [("U_ESP32", "GPIO9_SCL"), ("U_INA_PV", "SCL"), ("U_INA_BATT", "SCL")],

    "SIG_DS18":   [("U_ESP32", "GPIO4"), ("J_DS18B20", "2"), ("R_DS18", "2")],
    "SIG_CAP":    [("U_ESP32", "GPIO5"), ("J_CAP", "2")],
    "SIG_PH_DMS": [("U_ESP32", "GPIO6"), ("J_DMS", "2")],
    "SIG_DMS_D":  [("U_ESP32", "GPIO7"), ("J_DMS", "3")],

    "BUZ_SIG":    [("U_ESP32", "GPIO21_BUZ"), ("R_BUZ", "1")],
    "BUZ_BASE":   [("R_BUZ", "2"), ("Q1", "B")],
    "BUZ_SINK":   [("Q1", "C"), ("BZ1", "-")],
}

# Build .SCH XML
parts_xml = "\n".join(
    f'<part name="{name}" library="smart_soil_lib" deviceset="{dset}" device="" value="{val}"/>'
    for name, dset, val, *_ in PARTS
)
instances_xml = "\n".join(
    f'<instance part="{name}" gate="G$1" x="{sx:.2f}" y="{sy:.2f}"/>'
    for name, _, _, sx, sy, *_ in PARTS
)

# Schematic net labels / pinrefs (cleanly wired via net segments + pinrefs)
part_pos = {name: (sx, sy) for name, _, _, sx, sy, *_ in PARTS}
nets_xml_list = []
for net_name, refs in NETS.items():
    pinrefs = "\n".join(f'<pinref part="{p}" gate="G$1" pin="{pin}"/>' for p, pin in refs)
    # Use a small net stub at each part's origin so schematic has valid net topology
    p0, _ = refs[0]
    x0, y0 = part_pos[p0]
    nets_xml_list.append(
        f'<net name="{net_name}" class="0">\n<segment>\n{pinrefs}\n'
        f'<wire x1="{x0:.2f}" y1="{y0:.2f}" x2="{x0 + 2.54:.2f}" y2="{y0:.2f}" width="0.1524" layer="91"/>\n'
        f'<label x="{x0 + 2.54:.2f}" y="{y0:.2f}" size="1.27" layer="95"/>\n'
        f'</segment>\n</net>'
    )
nets_xml = "\n".join(nets_xml_list)

sch_content = f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE eagle SYSTEM "eagle.dtd">
<eagle version="6.5">
<drawing>
<settings>
<setting alwaysvectorfont="no"/>
<setting verticaltext="up"/>
</settings>
<grid distance="0.1" unitdist="inch" unit="inch" style="lines" multiple="1" display="no" altdistance="0.01" altunitdist="inch" altunit="inch"/>
{LAYERS_COMMON}
<schematic xreflabel="%F%N/%S.%C%R" xrefpart="/%S.%C%R">
<libraries>
<library name="smart_soil_lib">
<packages>
{PACKAGES_XML}
</packages>
<symbols>
{SYMBOLS_XML}
</symbols>
<devicesets>
{DEVICESETS_XML}
</devicesets>
</library>
</libraries>
<attributes/>
<variantdefs/>
<classes>
<class number="0" name="default" width="0" drill="0"/>
</classes>
<parts>
{parts_xml}
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
{instances_xml}
</instances>
<busses/>
<nets>
{nets_xml}
</nets>
</sheet>
</sheets>
</schematic>
</drawing>
</eagle>
"""

# Build .BRD XML (150mm x 90mm Landscape!)
elements_xml = "\n".join(
    f'<element name="{name}" library="smart_soil_lib" package="{dset}" value="{val}" x="{bx:.2f}" y="{by:.2f}" rot="{brot}"/>'
    for name, dset, val, _, _, bx, by, brot in PARTS
)

signals_xml_list = []
for net_name, refs in NETS.items():
    contacts = "\n".join(f'<contactref element="{p}" pad="{pin}"/>' for p, pin in refs)
    signals_xml_list.append(f'<signal name="{net_name}">\n{contacts}\n</signal>')
signals_xml = "\n".join(signals_xml_list)

brd_content = f"""<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE eagle SYSTEM "eagle.dtd">
<eagle version="6.5">
<drawing>
<settings>
<setting alwaysvectorfont="yes"/>
<setting verticaltext="up"/>
</settings>
<grid distance="1" unitdist="mm" unit="mm" style="lines" multiple="1" display="yes" altdistance="0.25" altunitdist="mm" altunit="mm"/>
{LAYERS_COMMON}
<board>
<plain>
<wire x1="0" y1="0" x2="150" y2="0" width="0" layer="20"/>
<wire x1="150" y1="0" x2="150" y2="90" width="0" layer="20"/>
<wire x1="150" y1="90" x2="0" y2="90" width="0" layer="20"/>
<wire x1="0" y1="90" x2="0" y2="0" width="0" layer="20"/>
<hole x="4" y="4" drill="3.2"/>
<hole x="146" y="4" drill="3.2"/>
<hole x="4" y="86" drill="3.2"/>
<hole x="146" y="86" drill="3.2"/>
<rectangle x1="129" y1="53" x2="148" y2="85" layer="41"/>
<text x="5" y="85.5" size="1.6" layer="21">ZONA FUSE + 2x INA226 + CN3791 + DC-DC 5V</text>
<text x="72" y="85.5" size="1.6" layer="21">ZONA ESP32-S3 N16R8 + BUZZER + PASIF</text>
<text x="131" y="68" size="1.4" layer="21">AREA ANTENA</text>
<text x="10" y="18" size="1.5" layer="21">SEMUA TERMINAL INPUT &amp; OUTPUT (SEJAJAR DI BAWAH)</text>
</plain>
<libraries>
<library name="smart_soil_lib">
<packages>
{PACKAGES_XML}
</packages>
</library>
</libraries>
<attributes/>
<variantdefs/>
<classes>
<class number="0" name="default" width="0.6096" drill="0"/>
<class number="1" name="power" width="1.27" drill="0"/>
</classes>
<designrules name="default">
<description language="en">Smart Soil 15x9cm Perfboard / PCB Rules</description>
<param name="layerSetup" value="(1*16)"/>
<param name="mtCopper" value="0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm 0.035mm"/>
<param name="mtIsolate" value="1.5mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm 0.15mm 0.2mm"/>
<param name="mdWireWire" value="12mil"/>
<param name="mdWirePad" value="12mil"/>
<param name="mdWireVia" value="12mil"/>
<param name="mdPadPad" value="12mil"/>
<param name="mdPadVia" value="12mil"/>
<param name="mdViaVia" value="12mil"/>
<param name="msWidth" value="16mil"/>
<param name="msDrill" value="24mil"/>
</designrules>
<autorouter>
<pass name="Default">
<param name="RoutingGrid" value="25mil"/>
</pass>
</autorouter>
<elements>
{elements_xml}
</elements>
<signals>
{signals_xml}
</signals>
</board>
</drawing>
</eagle>
"""

with open(SCH_PATH, "w", encoding="utf-8") as f:
    f.write(sch_content)

with open(BRD_PATH, "w", encoding="utf-8") as f:
    f.write(brd_content)

print("GENERATED:", SCH_PATH)
print("GENERATED:", BRD_PATH)
