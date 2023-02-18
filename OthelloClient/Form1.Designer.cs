namespace OthelloClient
{
    partial class Form1
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        ///  Required method for Designer support - do not modify
        ///  the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.button1 = new System.Windows.Forms.Button();
            this.button3 = new System.Windows.Forms.Button();
            this.textBox = new System.Windows.Forms.RichTextBox();
            this.panelBoard = new System.Windows.Forms.Panel();
            this.SuspendLayout();
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(12, 102);
            this.button1.Margin = new System.Windows.Forms.Padding(7, 8, 7, 8);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(188, 63);
            this.button1.TabIndex = 0;
            this.button1.Text = "Join\r\n";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.Button_Join_Click);
            // 
            // button3
            // 
            this.button3.Location = new System.Drawing.Point(12, 33);
            this.button3.Name = "button3";
            this.button3.Size = new System.Drawing.Size(188, 58);
            this.button3.TabIndex = 2;
            this.button3.Text = "Connect";
            this.button3.UseVisualStyleBackColor = true;
            this.button3.Click += new System.EventHandler(this.Button_Connect_Click);
            // 
            // textBox
            // 
            this.textBox.Font = new System.Drawing.Font("Segoe UI", 6F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.textBox.Location = new System.Drawing.Point(12, 620);
            this.textBox.Name = "textBox";
            this.textBox.Size = new System.Drawing.Size(838, 74);
            this.textBox.TabIndex = 4;
            this.textBox.Text = "";
            // 
            // panelBoard
            // 
            this.panelBoard.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.panelBoard.Location = new System.Drawing.Point(210, 33);
            this.panelBoard.Name = "panelBoard";
            this.panelBoard.Size = new System.Drawing.Size(640, 544);
            this.panelBoard.TabIndex = 7;
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(17F, 41F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(877, 730);
            this.Controls.Add(this.textBox);
            this.Controls.Add(this.panelBoard);
            this.Controls.Add(this.button3);
            this.Controls.Add(this.button1);
            this.Margin = new System.Windows.Forms.Padding(7, 8, 7, 8);
            this.Name = "Form1";
            this.Text = "Form1";
            this.Load += new System.EventHandler(this.Form1_Load);
            this.ResumeLayout(false);

        }

        #endregion

        private Button button1;
        private Button button3;
        private RichTextBox textBox;
        private Panel panelBoard;
    }
}