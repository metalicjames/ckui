function refresh() {
    $("#address_table").trigger("update");
    $("#outputs_list_table").trigger("update");
    $("#pending_outputs_table").trigger("update");
    $("#pending_inputs_table").trigger("update");
}

function populateOutputTable(accounts) {
    for(var i = 0; i < accounts.length; i++) {
        var account = accounts[i];
        $("#address_table").children("tbody").append("<tr><td>" + account["balance"] + "</td><td>" + account["name"] + "</td><td>" + account["address"] + "</td><tr>");        
        
        $.jsonRPC.request('listunspentoutputs', {
          params: {"account": accounts[i]["name"]},          
          success: function(result) {
                if(result["result"] != null) {
                    for(var j = 0; j < result["result"]["outputs"].length; j++) {
                        var output = result["result"]["outputs"][j];
                        var contract = "";
                        if(output["data"] != null) {
                            if(typeof output["data"]["contract"] != 'undefined') {
                                contract = output["data"]["contract"];
                            }
                        }
                        $("#outputs_list_table").children("tbody").append("<tr class=\"unspent_output\"><td><div>" + output["id"] + "</div></td><td><div>" 
                                                                   + output["publicKey"] + "</div></td><td><div>"
                                                                   + (output["value"] / 100000000.0) + "</div></td><td><div>"
                                                                   + contract + "</div></td></tr>");
                    }
                }
                
                refresh();
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
        });
    }
}

$(document).on("click", ".unspent_output", function() {    
    if($(this).parent().parent().attr("id") == "pending_outputs_table") {
        $("#outputs_list_table").children("tbody").append($(this));
    } else if($(this).parent().parent().attr("id") == "outputs_list_table") {
        $("#pending_outputs_table").children("tbody").append($(this));
    }
    
    refresh();
});

$(document).on("click", "#new_output_button", function() {    
    $("#new_output_form").toggle();
});

$(document).on("click", "#nav_address", function() {    
    $("#transaction_pane").hide();
    $("#address_pane").show();
    $("#compiler_pane").hide();
});

$(document).on("click", "#nav_transaction", function() {    
    $("#transaction_pane").show();
    $("#address_pane").hide();
    $("#compiler_pane").hide();
});

$(document).on("click", "#nav_compiler", function() {    
    $("#transaction_pane").hide();
    $("#address_pane").hide();
    $("#compiler_pane").show();
});

$(document).on("click", "#compile_button", function(event) {
    event.preventDefault();
    var contract = $(this).siblings("textarea").val();
    $.jsonRPC.request('compilecontract', {
          params: {"code": contract},
          success: function(result) {
            $("#compiler_result").text(result["result"]);
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
    });
});

$(document).on("click", "#new_output_add", function(event) {
    event.preventDefault();
    
    var output = {};
    
    output["id"] = "";
    output["value"] = $("#new_output_value").val() * 10000000;
    output["data"] = {};
    output["data"]["contract"] = $("#new_output_contract").val();
    output["publicKey"] = $("#new_output_address").val();
    
    //Calculate output id
    $.jsonRPC.request('calculateoutputid', {
          params: {"output": output},
          success: function(result) {
            //Add new output to table
            var output = {};
            output["id"] = result["result"];
            output["value"] = $("#new_output_value").val();
            output["data"] = {};
            output["data"]["contract"] = $("#new_output_contract").val();
            output["publicKey"] = $("#new_output_address").val();
            $("#pending_inputs_table").children("tbody").append("<tr class=\"pending_input\"><td><div>"  + output["id"] + 
                                                                "</div></td><td><div>" + output["publicKey"] + 
                                                                "</div></td><td><div>" + output["value"] + 
                                                                "</div></td><td><div>" + output["data"]["contract"] + "</div></td></tr>");
            refresh();
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
    });
});

$(document).on("click", ".pending_input", function(event) {
    $(this).remove();
    refresh();
});

$(document).ready(function() {

$.jsonRPC.setup({
  endPoint: 'http://localhost:8383/',
  namespace: ''
});

$.jsonRPC.request('getinfo', {
  params: {},
  success: function(result) {
    $("#server_info").html("<p>CK Version: " + result["result"]["CK Version"] 
			              + "<br>RPC Version: " + result["result"]["RPC Version"] 
                          + "<br>Height: " + result["result"]["height"] 
                          + "<br>Balance: " + result["result"]["balance"] 
                          + "<br>Connections: " + result["result"]["connections"] + "</p>");
  },
  error: function(result) {
      throw new Error(result["error"]["message"]);    
  }
});

$.jsonRPC.request('listaccounts', {
  params: {},
  success: function(result) {
    var accounts = result["result"]["accounts"];
    populateOutputTable(accounts);
  },
  error: function(result) {
      throw new Error(result["error"]["message"]);    
  }
});

$("#address_table").tablesorter(); 
$("#pending_outputs_table").tablesorter();
$("#outputs_list_table").tablesorter();
$("#pending_inputs_table").tablesorter();

});
