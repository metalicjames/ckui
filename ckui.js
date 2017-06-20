function getTransaction() {
    var inputs = $('#pending_outputs_table tbody').children("tr").map(function(i, v) {
        var $td = $('div', this);
        var returning = {
             outputId: $td.eq(0).text()     
        }
        
        return returning;
    }).get();
    
    var outputs = $('#pending_inputs_table tbody').children("tr").map(function(i, v) {
        var $td = $('div', this);
        var returning = {
             value: parseInt($td.eq(2).text() * 100000000),
             nonce: parseInt($td.eq(3).text()),
             data: {publicKey: $td.eq(1).text()}   
        }
        
        if($td.eq(4).text() != "") {
            returning["data"]["contract"] = $td.eq(4).text();
        }
        
        return returning;
    }).get();
    
    var tx = {inputs: inputs, outputs: outputs};
    
    return tx;
}

$(document).on("click", "#send_transaction_button", function() {  
    var tx = JSON.parse($("#tx_preview_pane p").text());
    $.jsonRPC.request('sendrawtransaction', {
          params: {"transaction": tx},
          success: function(result) {
            alert("Transaction successfully submitted");
            window.location.reload();
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
    });
});

$(document).on("click", "#sign_transaction_button", function() {    
    var tx = getTransaction();
    $.jsonRPC.request('signtransaction', {
          params: {"transaction": tx},
          success: function(result) {
            $("#tx_preview_pane p").text(JSON.stringify(result["result"], null, 4));
            $("#tx_preview_pane").show();
            $("#transaction_pane").hide();
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
    });
});

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
                        var publicKey = "";
                        if(output["data"] != null) {
                            if(typeof output["data"]["contract"] != 'undefined') {
                                contract = output["data"]["contract"];
                            }
                            if(typeof output["data"]["publicKey"] != 'undefined') {
                                publicKey = output["data"]["publicKey"];
                            }
                        }
                        $("#outputs_list_table").children("tbody").append("<tr class=\"unspent_output\"><td><div>" + output["id"] + "</div></td><td><div>" 
                                                                   + publicKey + "</div></td><td><div>"
                                                                   + (output["value"] / 100000000.0) + "</div></td><td><div>"
                                                                   + output["nonce"] + "</div></td><td><div>"
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
        $("#total").text((parseFloat($("#total").text()) - parseFloat($(this).children("td").children("div").eq(2).text())).toFixed(8));
        if($("#pending_outputs_table").children("tbody").children().length == 0) {
            $("#total").text("0");
        }
    } else if($(this).parent().parent().attr("id") == "outputs_list_table") {
        $("#pending_outputs_table").children("tbody").append($(this));
        $("#total").text((parseFloat($("#total").text()) + parseFloat($(this).children("td").children("div").eq(2).text())).toFixed(8));
    }
    
    refresh();
});

$(document).on("click", "#new_output_button", function() {    
    $("#new_output_form").toggle();
});

$(document).on("click", "#new_address_button", function() {    
    $("#new_address_form").toggle();
});

$(document).on("click", "#nav_address", function() {    
    $("#transaction_pane").hide();
    $("#address_pane").show();
    $("#compiler_pane").hide();
    $("#send_pane").hide();
    $("#explorer_pane").hide();
});

$(document).on("click", "#nav_transaction", function() {    
    $("#transaction_pane").show();
    $("#address_pane").hide();
    $("#compiler_pane").hide();
    $("#send_pane").hide();
    $("#explorer_pane").hide();
});

$(document).on("click", "#nav_compiler", function() {    
    $("#transaction_pane").hide();
    $("#address_pane").hide();
    $("#send_pane").hide();
    $("#compiler_pane").show();
    $("#explorer_pane").hide();
});

$(document).on("click", "#nav_send", function() {    
    $("#transaction_pane").hide();
    $("#address_pane").hide();
    $("#compiler_pane").hide();
    $("#send_pane").show();
    $("#explorer_pane").hide();
});

$(document).on("click", "#nav_explorer", function() {    
    $("#transaction_pane").hide();
    $("#address_pane").hide();
    $("#compiler_pane").hide();
    $("#send_pane").hide();
    $("#explorer_pane").show();
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
    output["value"] = $("#new_output_value").val() * 100000000;
    output["data"] = {};
    if($("#new_output_contract").val() != "") {
        output["data"]["contract"] = $("#new_output_contract").val();
    }
    output["data"]["publicKey"] = $("#new_output_address").val();
    output["nonce"] = Math.floor((Math.random() * 100000000) + 1);
    $("#new_output_nonce").val(output["nonce"]);
    
    //Calculate output id
    $.jsonRPC.request('calculateoutputid', {
          params: {"output": output},
          success: function(result) {
            //Add new output to table
            var output = {};
            output["id"] = result["result"];
            output["value"] = $("#new_output_value").val();
            output["nonce"] = $("#new_output_nonce").val();
            output["data"] = {};
            output["data"]["contract"] = $("#new_output_contract").val();
            output["data"]["publicKey"] = $("#new_output_address").val();
            $("#pending_inputs_table").children("tbody").append("<tr class=\"pending_input\"><td><div>"  + output["id"] + 
                                                                "</div></td><td><div>" + output["data"]["publicKey"] + 
                                                                "</div></td><td><div>" + output["value"] + 
                                                                "</div></td><td><div>" + output["nonce"] + 
                                                                "</div></td><td><div>" + output["data"]["contract"] + "</div></td></tr>");
            refresh();
            
            $("#new_output_form").trigger('reset');
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
    });
});

$(document).on("click", "#new_address_add", function(event) {
    event.preventDefault();
    
    $.jsonRPC.request('account', {
          params: {"account": $("#new_address_name").val()},
          success: function(result) {
            var account = result["result"];
            $("#address_table").children("tbody").prepend("<tr><td>" + account["balance"] + "</td><td>" + account["name"] + "</td><td>" + account["address"] + "</td><tr>");
            $("#new_address_name").val("");
          },
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
    });
});

$(document).on("click", "#send_button", function(event) {
    event.preventDefault();
    
    $.jsonRPC.request('sendtoaddress', {
          params: {"address": $("#send_address").val(),
                   "amount": $("#send_amount").val() * 1.0},
          success: function(result) {
              alert(result["result"]);
              window.location.reload();
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

function refreshAccountsTable() {
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
}

function loadBlockExplorer() {
    var appendBlock = function(height) {
        return function(result) {
            var total = 0;
            for(y = 0; y < result["result"]["coinbaseTx"]["outputs"].length; y++) {
                total += result["result"]["coinbaseTx"]["outputs"][y]["value"];
            }
            
            if(result["result"]["transactions"] != null) {
                for(y = 0; y < result["result"]["transactions"].length; y++) {
                    for(j = 0; j < result["result"]["transactions"][y]["outputs"].length; j++) {
                        total += result["result"]["transactions"][y]["outputs"][j]["value"];   
                    }
                }
            }
            $("#block_list_table").children("tbody").append("<tr><td>" + height + "</td><td>" + result["result"]["id"] + "</td><td>" + (total / 100000000.0) + "</td></tr>");
        };
    };


    for(i = window.chainInfo["height"]; i >= 1 && window.chainInfo["height"] - i <= 20; i--) {
        $.jsonRPC.request('getblockbyheight', {
          params: {"height": i},
          success: appendBlock(i),
          error: function(result) {
              throw new Error(result["error"]["message"]);    
          }
        });
    }
}

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
    window.chainInfo = result["result"];
    
    loadBlockExplorer();
  },
  error: function(result) {
      throw new Error(result["error"]["message"]);    
  }
});

refreshAccountsTable();

$("#address_table").tablesorter(); 
$("#pending_outputs_table").tablesorter();
$("#outputs_list_table").tablesorter();
$("#pending_inputs_table").tablesorter();

});
