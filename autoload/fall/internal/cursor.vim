let s:t_ve_saved = &t_ve
let s:guicursor_saved = &guicursor

function! fall#internal#cursor#hide() abort
  call s:hide_cursor()
endfunction

function! fall#internal#cursor#show() abort
  call s:show_cursor()
endfunction

if has('nvim-0.5.0')
  function! s:hide_cursor() abort
    set guicursor+=a:FallTransparentCursor/lCursor
  endfunction

  function! s:show_cursor() abort
    set guicursor+=a:Cursor/lCursor
    let &guicursor = s:guicursor_saved
  endfunction

  function! s:highlight() abort
    highlight FallTransparentCursor gui=strikethrough blend=100
  endfunction
  call s:highlight()

  augroup fall_internal_cursor
    autocmd!
    autocmd ColorScheme * call s:highlight()
  augroup END
elseif has('nvim') || has('gui_running')
  function! s:hide_cursor() abort
    set guicursor+=a:ver1
  endfunction

  function! s:show_cursor() abort
    let &guicursor = s:guicursor_saved
  endfunction
else
  function! s:hide_cursor() abort
    set t_ve=
  endfunction

  function! s:show_cursor() abort
    let &t_ve = s:t_ve_saved
  endfunction
endif
