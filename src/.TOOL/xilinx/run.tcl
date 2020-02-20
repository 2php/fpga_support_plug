set_param general.maxThreads 6
variable current_Location [file normalize [info script]]
while {1} {
    puts "---------what do you want to do next---------"
    puts "1) Updata_file"
    puts "2) Build"
    puts "3) program"
    puts "4) Debug"
    puts "5) GUI"
    puts "6) exit"
    gets stdin your_choose;
    if {$your_choose == 1} {source [file dirname $current_Location]/Updata.tcl -notrace;}
    if {$your_choose == 2} {source [file dirname $current_Location]/Build.tcl -notrace;}
    if {$your_choose == 3} {source [file dirname $current_Location]/program.tcl -notrace;}
    if {$your_choose == 4} {source [file dirname $current_Location]/Debug.tcl -notrace;}
    if {$your_choose == 5} {break;}
    if {$your_choose == 6} {close_project -quiet;break;}
}
if {$your_choose == 5} {
    start_gui -quiet
}
