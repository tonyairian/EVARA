(function ($) {
  let price = [];
  ("use strict");
  $.ajax({
    url: "/admin/test",
    method: "get",
    success: (response) => {

      for (i = 1; i <= 30; i++) {
        for (j = 0; j < 30; j++) {
          if (response[j]?._id == i) {
            console.log(i+"date");
            price[i] = response[j]?.totalAmount;
            console.log(price[i]);
            break;
          } else {
            price[i] = 0;
          }
        }
      }
      if ($("#myChart").length) {
        var ctx = document.getElementById("myChart").getContext("2d");
        var chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: [
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
              "10",
              "11",
              "12",
              "13",
              "14",
              "15",
              "16",
              "17",
              "18",
              "19",
              "20",
              "21",
              "22",
              "23",
              "24",
              "25",
              "26",
              "27",
              "28",
              "29",
              "30",
              "31",
            ],
            datasets: [
              {
                label: "Daily Sales",
                tension: 0.3,
                fill: true,
                backgroundColor: "rgba(150, 214, 154)",
                borderColor: "rgba(30, 199, 40)",
                data: [
                  price[1],
                  price[2],
                  price[3],
                  price[4],
                  price[5],
                  price[6],
                  price[7],
                  price[8],
                  price[9],
                  price[10],
                  price[11],
                  price[12],
                  price[13],
                  price[14],
                  price[15],
                  price[16],
                  price[17],
                  price[18],
                  price[19],
                  price[20],
                  price[21],
                  price[22],
                  price[23],
                  price[24],
                  price[25],
                  price[26],
                  price[27],
                  price[28],
                  price[29],
                  price[30],
                  price[31],
                ],
              },
            ],
          },
          options: {
            plugins: {
              legend: {
                labels: {
                  usePointStyle: true,
                },
              },
            },
          },
        });
      } //End if
    },
  });
  $.ajax({
    url: "/admin/test3",
    method: "get",
    success: (response) => {
  
      let one = response[0]._id;
      let two = response[1]._id;
      let three = response[2]._id;
      // let four = response[3]._id;

      /Payment method/;
      if ($("#myChart2").length) {
        var ctx = document.getElementById("myChart2").getContext("2d");

        var xValues = [one, two,three];
        var yValues = [
          response[0].count,
          response[1].count,
          response[2].count,
          // response[3].count,
        ];
        var barColors = ["#b91d47", "#00aba9", "#2b5797"];
        var myChart = new Chart(ctx, {
          // The type of chart we want to create
          type: "pie",

          // The data for our dataset

          data: {
            labels: xValues,
            datasets: [
              {
                backgroundColor: barColors,
                data: yValues,
              },
            ],
          },
          options: {
            title: {
              display: true,
              text: "World Wide Wine Production 2018",
            },
          },
        });
      } //End if
    },
  });
})(jQuery);
