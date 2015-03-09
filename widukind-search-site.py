from flask import Flask, render_template, request, redirect, session, make_response
from dlstats import configuration
import pymongo
from elasticsearch import Elasticsearch
import os
import pandas
import io
import csv

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'very very secret key key key'
#app.secret_key = os.urandom(24)

def elasticsearch_query_datasets(query):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', doc_type = 'datasets', size=20, body={"query": {"query_string": {"query": query}}})
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        results.append({"datasetCode": s["datasetCode"], "name": s["name"]})
    return results

def mongodb_series_by_key(key):
    mb = pymongo.MongoClient(**configuration['MongoDB'])
    print(key)
    series = mb.widukind.series.find_one({'key': key},{'revisions': 0})
    return series
    
def elasticsearch_query_series(query):
    es = Elasticsearch(host = "localhost")
    res = es.search(index = 'widukind', doc_type = 'series', size=20, body={"query": {"query_string": {"query": query}}})
    results = []
    for hit in res['hits']['hits']:
        s = hit["_source"]
        results.append({"key": s["key"], "name": s["name"]})
    return results

@app.route('/')
def initial_page():
    return render_template('search_series.html')
#    return render_template('search_datasets.html')

@app.route('/facet1', methods = ['POST'])
def facet1():
    req = []
    if 'provider' in request.form.keys():
        req = request.form['provider']
    print(req)
    return redirect('/')

@app.route('/search_datasets', methods = ['POST'])
def search_datasets():
    query = request.form['query']
    results = elasticsearch_query_datasets(query)
    session['query'] = query
    session['results'] = results
    return render_template('search_datasets.html')

@app.route('/search_series', methods = ['POST'])
def search_series():
    query = request.form['query']
    results = elasticsearch_query_series(query)
    session['query'] = query
    session['results'] = results
    return render_template('search_series.html')

@app.route('/print_series', methods = ['GET', 'POST'])
def print_series():
    key = next(request.args.lists())[0]
    series = mongodb_series_by_key(key)
    session['name'] = series['name']
    session['key'] = series['key']
    session['dimensions'] = series['dimensions']
    sd = pandas.Period(series['startDate'],freq=series['frequency'])
    values = []
    for val in series['values']:
        values.append([str(sd), val])
        sd += 1
    session['elements'] = values
    return render_template('print_series.html')

@app.route('/plot_series', methods = ['GET', 'POST'])
def plot_series():
    key = next(request.args.lists())[0]
    series = mongodb_series_by_key(key)
    session['name'] = series['name']
    session['key'] = series['key']
    sd = pandas.Period(series['startDate'],freq=series['frequency'])
    values = []
    for val in series['values'][:-1]:
        values.append([sd.to_timestamp(), val, '+'])
        sd += 1
    values.append([sd.to_timestamp(), val, ''])
    session['elements'] = values
    return render_template('plot_series.html')

@app.route('/download_series', methods = ['GET', 'POST'])
def download_series():
    key = next(request.args.lists())[0]
    series = mongodb_series_by_key(key)
    sd = pandas.Period(series['startDate'],freq=series['frequency'])
    values = []
    for val in series['values']:
        values.append([str(sd), val])
        sd += 1
    csv_output = io.StringIO()
    writer = csv.writer(csv_output, quoting=csv.QUOTE_NONNUMERIC)
    writer.writerows(values)
    
    response = make_response(csv_output.getvalue())
    response.headers["Content-disposition"] = "attachment; filename="+key+".csv"
    
    return response

if __name__ == '__main__':
    app.debug = True
    app.run()
