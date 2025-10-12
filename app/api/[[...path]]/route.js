import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_API_URL is not defined in environment variables');
}

// Create axios instance for API proxy
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increased timeout for ngrok
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'NextJS-API-Proxy/1.0'
  },
});

// Helper function to forward requests to external API
async function forwardRequest(method, path, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: path,
      headers: {
        ...headers,
        // Enhanced ngrok headers
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'NextJS-API-Proxy/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      // Add retry logic for ngrok
      retry: 3,
      retryDelay: 1000
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await api(config);
    return response.data;
  } catch (error) {
    // Enhanced error logging for ngrok issues
    if (error.code === 'ERR_NGROK_6024' || error.message.includes('ngrok')) {
      console.error(`Ngrok Error [${method} ${path}]:`, {
        code: error.code,
        message: error.message,
        baseURL: API_BASE_URL,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`API Error [${method} ${path}]:`, error.response?.data || error.message);
    }
    throw error;
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    const searchParams = url.searchParams.toString();
    
    // Get auth headers to forward
    const authHeader = request.headers.get('authorization');
    const forwardHeaders = {};
    if (authHeader) {
      forwardHeaders.authorization = authHeader;
    }

    try {
      const fullPath = searchParams ? `${path}?${searchParams}` : path;
      const result = await forwardRequest('GET', fullPath, null, forwardHeaders);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error.response?.data?.error || error.message || 'Internal server error' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // No JSON body or invalid JSON, use empty object
      body = {};
    }

    // Get auth headers to forward
    const authHeader = request.headers.get('authorization');
    const forwardHeaders = {};
    if (authHeader) {
      forwardHeaders.authorization = authHeader;
    }

    try {
      const result = await forwardRequest('POST', path, body, forwardHeaders);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error.response?.data?.error || error.message || 'Internal server error' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      body = {};
    }

    // Get auth headers to forward
    const authHeader = request.headers.get('authorization');
    const forwardHeaders = {};
    if (authHeader) {
      forwardHeaders.authorization = authHeader;
    }

    try {
      const result = await forwardRequest('PUT', path, body, forwardHeaders);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error.response?.data?.error || error.message || 'Internal server error' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      body = {};
    }

    // Get auth headers to forward
    const authHeader = request.headers.get('authorization');
    const forwardHeaders = {};
    if (authHeader) {
      forwardHeaders.authorization = authHeader;
    }

    try {
      const result = await forwardRequest('PATCH', path, body, forwardHeaders);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error.response?.data?.error || error.message || 'Internal server error' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');
    
    // Get auth headers to forward
    const authHeader = request.headers.get('authorization');
    const forwardHeaders = {};
    if (authHeader) {
      forwardHeaders.authorization = authHeader;
    }

    try {
      const result = await forwardRequest('DELETE', path, null, forwardHeaders);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error.response?.data?.error || error.message || 'Internal server error' },
        { status: error.response?.status || 500 }
      );
    }
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}