from flask import render_template, redirect, url_for
from app import app

# front page
@app.route('/')
@app.route('/index')
def index():
    return redirect(url_for('main'))
    
   
# decision maker
@app.route('/main')
def main():
    return render_template('main.html',
                           title=app.config['TITLE'] + ' control page')
           
		   
		   
