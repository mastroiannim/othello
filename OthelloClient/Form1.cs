using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Dynamic;
using System.Net;
using System.Net.Sockets;
using System.Text;

namespace OthelloClient
{
    public partial class Form1 : Form
    {
        readonly IPAddress host = IPAddress.Parse("127.0.0.1");
        private readonly int port = 8080;
        private StreamWriter? writer;
        private StreamReader? reader;
        private TcpClient? client;
        private NetworkStream? netstream;
        private readonly int timeout = 5000;
        private string player = "";
        private char[][] board;
        Panel[,] panelMatrix;
        Panel panriga;
        private int numRows = 8;
        private int numCols = 8;

        public Form1()
        {
            // Creare la matrice di pannelli
            panelMatrix = new Panel[numRows, numCols];
            this.board = new char[numRows][];
            for (int i = 0; i < numCols; i++)
                this.board[i] = new char[numCols];
            InitializeComponent();
        }

        private void Connect()
        {
            try
            {
                textBox.Clear();

                client = new TcpClient();

                client.ConnectAsync(host, port)
                    .ContinueWith(task =>
                    {
                        netstream = client.GetStream();
                        writer = new StreamWriter(netstream);
                        reader = new StreamReader(netstream);

                        writer.AutoFlush = true;
                        netstream.ReadTimeout = timeout;
                        textBox.AppendText("Connesso!");
                    });
            }
            catch (Exception a)
            {
                textBox.AppendText($"Connect Exception: {a.Message}");
            }
        }

        private void DrawBoard()
        {
            //DRAW BOARD


            // Creare e inizializzare ogni pannello nella matrice
            for (int row = 0; row < numRows; row++)
            {
                for (int col = 0; col < numCols; col++)
                {                        
                    if (board[row][col] == 'W')
                        panelMatrix[numRows - 1 - row, numCols - 1 - col].BackColor = Color.AntiqueWhite;
                    else if (board[row][col] == 'B')
                        panelMatrix[numRows - 1 - row, numCols - 1 - col].BackColor = Color.Black;
                    else
                        panelMatrix[numRows - 1 - row, numCols - 1 - col].BackColor = Color.Green;
                }
            }
        }

        private void Turn(dynamic res)
        {
            player = res.currentPlayer;
            JArray boardArray = (JArray)res.board;
            board = boardArray.Select(x => x.Select(y => ((string)y)[0]).ToArray()).ToArray();
            DrawBoard();
        }

        private async void WaitMyTurn(string p)
        {
            try
            {
                dynamic myObject = new ExpandoObject();
                myObject.type = "wait_my_turn";
                myObject.player = p;

                string json = JsonConvert.SerializeObject(myObject);


                await writer!.WriteLineAsync(json)
                    .ContinueWith(task =>
                    {
                        Read();
                    });

            }
            catch (Exception e)
            {
                textBox.AppendText($"WaitMyTurn Exception: {e.Message}");
            }
            finally
            {
                //
            }
        }  

        private void ValidMove(dynamic res)
        {
            string currentPlayer = res.currentPlayer;

            JArray boardArray = (JArray)res.board;
            board = boardArray.Select(x => x.Select(y => ((string)y)[0]).ToArray()).ToArray();

            if(currentPlayer == player)
            {
                WaitMyTurn(player);
            }

            DrawBoard();
        }

        private async void Read()
        {
            try
            {
                // Prepara il buffer per leggere i dati dalla socket
                byte[] buffer = new byte[1024];
                StringBuilder data = new StringBuilder();
                textBox.Clear();


                int bytes = 0;
                do
                {
                    bytes = await netstream.ReadAsync(buffer, 0, buffer.Length);
                    data.Append(Encoding.ASCII.GetString(buffer, 0, bytes));
                } while (netstream.DataAvailable);
                textBox.AppendText(data.ToString());
                //Console.WriteLine($"from Server receive: {data}");
                var res = JsonConvert.DeserializeObject<dynamic>(data.ToString());

                string type = res!.type;

                switch ( type)
                {
                    case "your_turn":
                        Turn(res);
                        break;
                    case "valid_move":
                        ValidMove(res);
                        break;
                    default:
                        break;
                }

            }
            catch (Exception e)
            {
                textBox.AppendText($"Read Exception: {e.Message}");
            }
            finally
            {
                //
            }
        }

        private async void MoveXY(int x, int y)
        {
            try
            {
                dynamic myObject = new ExpandoObject();
                myObject.type = "move";
                myObject.x = x;
                myObject.y = y;
                myObject.player = player;

                string json = JsonConvert.SerializeObject(myObject);

                await writer!.WriteLineAsync(json)
                    .ContinueWith(task =>
                    {
                        Read();
                    });
            }
            catch (Exception e)
            {
                textBox.AppendText($"Move Exception: {e.Message}");
            }
            finally
            {
                //
            }

        }

        private async void Join()
        {
            try
            {
                dynamic myObject = new ExpandoObject();
                myObject.type = "join";

                string json = JsonConvert.SerializeObject(myObject);

                await writer!.WriteLineAsync(json)
                    .ContinueWith(task =>
                    {
                        Read();
                        textBox.AppendText("Joined!");
                    });

            }
            catch(Exception e)
            {
                textBox.AppendText($"Join Exception: {e.Message}");
            }
            finally
            {
                //
            }
        }

        private void Button_Join_Click(object sender, EventArgs e)
        {
            Join();

        }

        private void Button_Connect_Click(object sender, EventArgs e)
        {
            Connect();
        }

        private void Board_Click(object sender, EventArgs e)
        {
            string move = (string)((Panel)sender).Tag;
            //Console.WriteLine(move);
            int x = Int32.Parse(move.Split(",")[0]);
            int y = Int32.Parse(move.Split(",")[1]);
            MoveXY(x, y);
        }

        private void Form1_Load(object sender, EventArgs e)
        {

            int h = panelBoard.Size.Height / numRows;
            int w = panelBoard.Size.Width / numCols;

            // Creare e inizializzare ogni pannello nella matrice
            for (int row = 0; row < numRows; row++)
            {
                panriga = new Panel();
                panriga.Name = "panriga" + row.ToString();
                panriga.Dock = DockStyle.Top;
                panriga.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
                panriga.Size = new System.Drawing.Size(panelBoard.Size.Width, h);
                panelBoard.Controls.Add(panriga);


                for (int col = 0; col < numCols; col++)
                {
                    panelMatrix[row, col] = new Panel();

                    panelMatrix[row, col].Tag = (numCols - col - 1) + "," + (numRows - row - 1);
                    panelMatrix[row, col].Name = "panel_" + row.ToString() + "_" + col.ToString();
                    panelMatrix[row, col].BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
                    //panelMatrix[row, col].BackColor = Color.White;
                    panelMatrix[row, col].AutoSize = false;
                    panelMatrix[row, col].Size = new System.Drawing.Size(w, h);
                    panelMatrix[row, col].Location = new System.Drawing.Point(0, 0);

                    //MessageBox.Show("Colonna " + Convert.ToString(col));
                    panelMatrix[row, col].Dock = DockStyle.Left;
                    panriga.Controls.Add(panelMatrix[row, col]);
                    // Aggiungere il pannello al form
                    panelMatrix[row, col].Click += new System.EventHandler(this.Board_Click);
                }
            }
            DrawBoard();
        }


    }
}