function! fall#internal#cursor#hide() abort
  call s:hide_cursor()
endfunction

function! fall#internal#cursor#show() abort
  call s:show_cursor()
endfunction

if has('nvim')
  function! s:hide_cursor() abort
    if exists('s:guicursor_saved')
      return
    endif
    let s:guicursor_saved = &guicursor
    silent! highlight FallTransparentCursor gui=strikethrough blend=100
    set guicursor+=a:FallTransparentCursor/lCursor
  endfunction

  function! s:show_cursor() abort
    if !exists('s:guicursor_saved')
      return
    endif
    set guicursor+=a:Cursor/lCursor
    silent! let &guicursor = s:guicursor_saved
    silent! unlet! s:guicursor_saved
  endfunction
elseif has('gui_running')
  function! s:hide_cursor() abort
    if exists('s:guicursor_saved')
      return
    endif
    let s:guicursor_saved = &guicursor
    set guicursor+=a:ver1
  endfunction

  function! s:show_cursor() abort
    if !exists('s:guicursor_saved')
      return
    endif
    let &guicursor = s:guicursor_saved
    unlet s:guicursor_saved
  endfunction
else
  function! s:hide_cursor() abort
    if exists('s:t_ve_saved')
      return
    endif
    let s:t_ve_saved = &t_ve
    set t_ve=
  endfunction

  function! s:show_cursor() abort
    if !exists('s:t_ve_saved')
      return
    endif
    let &t_ve = s:t_ve_saved
    unlet s:t_ve_saved
  endfunction
endif
