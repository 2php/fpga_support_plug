module testbench();

parameter DATA_WIDTH = 32;
parameter ADDR_WIDTH = 32;
parameter MAIN_FRE   = 100; //unit MHz
reg                   clk       = 0;
reg                   sys_rst_n = 0;
reg [DATA_WIDTH-1:0]  data = 0;
reg [ADDR_WIDTH-1:0]  addr = 0;

always begin
    #(500/MAIN_FRE) clk = ~clk;
end
always begin
    #50 sys_rst_n = 1;
end
always begin
    if (sys_rst_n) begin
        #10 addr = addr + 1;#10;
    end
    else begin     
        #10 addr = 0;#10;
    end
end
always begin
    if (sys_rst_n) begin
        #10 data = data + 1;#10;
    end
    else begin     
        #10 data = 0;#10;
    end
end




//Instance 




initial begin            
    $dumpfile("wave.vcd");        
    $dumpvars(0, testbench);    
end

endmodule  //TOP