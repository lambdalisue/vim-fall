const s:sep = has('win32') ? '\\' : '/'

function! fall#path#join(segments) abort
  return join(a:segments, s:sep)
endfunction
